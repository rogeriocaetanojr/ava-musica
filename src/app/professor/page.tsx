import Link from "next/link";
import { Suspense } from "react";
import { Aviso } from "@/components/aviso";
import { BarraProgresso } from "@/components/barra-progresso";
import { classesDoBotao } from "@/components/botao";
import { CabecalhoDoProfessor } from "@/components/cabecalho-do-professor";
import { Cordas } from "@/components/cordas";
import { exigirProfessor } from "@/lib/auth";
import { dataPorExtenso, quandoFoi } from "@/lib/datas";
import { iniciais } from "@/lib/nomes";
import {
  type SituacaoDoAluno,
  aulasConcluidasNaSemana,
  resumoParaProfessor,
  situacaoDoAluno,
} from "@/lib/painel";
import { aulasEmOrdem } from "@/lib/progresso";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { PedidosDeAcesso } from "./pedidos-de-acesso";
import { RecusadosRecentes } from "./recusados-recentes";
import {
  type CursoDoPainel,
  type ProgressoDoPainel,
  dadosDoPainel,
  situacaoDosAlunos,
  ultimoRecado,
} from "./progresso/dados";

const cartao = "rounded-3xl border border-linha bg-superficie";
const tituloDeCartao = "font-titulo text-2xl text-texto";

// Cores dos avatares, alternadas pela ordem da lista.
const AVATARES = [
  "bg-bordo text-superficie",
  "bg-amarelo text-texto-sobre-amarelo",
  "bg-amarelo-claro text-texto-sobre-amarelo",
  "bg-vinho text-superficie",
];

const ETIQUETAS: Record<SituacaoDoAluno, { texto: string; classe: string }> = {
  ativo: { texto: "Ativo", classe: "bg-linha text-bordo" },
  aguardando: {
    texto: "Aguardando responsável",
    classe: "bg-amarelo-claro text-texto-sobre-amarelo",
  },
  bloqueado: { texto: "Bloqueado", classe: "bg-vinho text-superficie" },
};

function ErroAoCarregar({ children }: { children: React.ReactNode }) {
  return <Aviso role="alert">{children}</Aviso>;
}

function Icone({ caminho }: { caminho: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={caminho} />
    </svg>
  );
}

// "Aula N · hoje": a aula concluída mais recente do aluno no curso, com o
// número na ordem do curso.
function ultimaAulaNoCurso(
  curso: CursoDoPainel,
  registros: ProgressoDoPainel[],
): string | null {
  const aulas = aulasEmOrdem(curso.modulos);
  let ultima: ProgressoDoPainel | null = null;
  for (const r of registros)
    if (
      !r.conteudo_id &&
      aulas.some((a) => a.id === r.aula_id) &&
      (!ultima || Date.parse(r.concluido_em) > Date.parse(ultima.concluido_em))
    )
      ultima = r;
  if (!ultima) return null;
  const numero = aulas.findIndex((a) => a.id === ultima.aula_id) + 1;
  return `Aula ${numero} · ${quandoFoi(ultima.concluido_em)}`;
}

function Indicador({
  numero,
  rotulo,
  estilo = "claro",
}: {
  numero: number;
  rotulo: string;
  estilo?: "claro" | "bordo" | "amarelo";
}) {
  const fundo = {
    claro: "border-linha bg-superficie text-texto",
    bordo: "border-bordo bg-bordo text-superficie",
    amarelo: "border-amarelo bg-amarelo-claro text-texto-sobre-amarelo",
  }[estilo];
  return (
    <li className={`relative overflow-hidden rounded-3xl border p-6 ${fundo}`}>
      {estilo === "bordo" && (
        <Cordas className="absolute inset-y-0 right-6 w-24 border-l border-vinho pl-5" />
      )}
      <p className="relative flex flex-col gap-2">
        <span
          className={`font-titulo text-5xl ${
            estilo === "bordo"
              ? "text-amarelo"
              : estilo === "claro"
                ? "text-bordo"
                : ""
          }`}
        >
          {numero}
        </span>
        <span className="text-sm font-semibold">{rotulo}</span>
      </p>
    </li>
  );
}

async function Resumo() {
  await exigirProfessor();

  const [dados, situacoes] = await Promise.all([
    dadosDoPainel(),
    situacaoDosAlunos(),
  ]);
  if (!dados || !situacoes)
    return (
      <ErroAoCarregar>
        Não foi possível carregar o progresso dos alunos.
      </ErroAoCarregar>
    );

  const situacaoPorId = new Map(
    situacoes.map((s) => [
      s.id,
      situacaoDoAluno({
        menor_de_12: s.menor_de_12,
        bloqueado_em: s.bloqueado_em,
        aceito_em: s.responsaveis?.aceito_em ?? null,
      }),
    ]),
  );
  const situacaoDe = (id: string) => situacaoPorId.get(id) ?? "ativo";
  const ativos = dados.alunos.filter(
    (a) => situacaoDe(a.id) !== "bloqueado",
  ).length;
  const aceitesPendentes = dados.alunos.filter(
    (a) => situacaoDe(a.id) === "aguardando",
  ).length;
  const publicados = dados.cursos.filter((c) => c.publicado).length;
  const naSemana = aulasConcluidasNaSemana(dados.progresso);

  const cursoPorId = new Map(dados.cursos.map((c) => [c.id, c]));
  const linhas = dados.alunos.flatMap((aluno, indice) => {
    const registros = dados.progresso.filter((r) => r.aluno_id === aluno.id);
    const cursos = aluno.matriculas
      .map((m) => cursoPorId.get(m.curso_id))
      .filter((c) => c !== undefined)
      .sort((a, b) => a.titulo.localeCompare(b.titulo));
    const base = {
      aluno,
      avatar: AVATARES[indice % AVATARES.length],
      situacao: situacaoDe(aluno.id),
      registros,
    };
    const comCurso: (typeof base & { curso: CursoDoPainel | null })[] =
      cursos.length === 0
        ? [{ ...base, curso: null }]
        : cursos.map((curso) => ({ ...base, curso }));
    return comCurso;
  });

  return (
    <>
      <ul
        aria-label="Indicadores"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Indicador
          numero={ativos}
          rotulo={ativos === 1 ? "aluno ativo" : "alunos ativos"}
          estilo="bordo"
        />
        <Indicador
          numero={publicados}
          rotulo={publicados === 1 ? "curso publicado" : "cursos publicados"}
        />
        <Indicador
          numero={naSemana}
          rotulo={
            naSemana === 1
              ? "aula concluída na semana"
              : "aulas concluídas na semana"
          }
        />
        <Indicador
          numero={aceitesPendentes}
          rotulo={
            aceitesPendentes === 1
              ? "aceite de responsável pendente"
              : "aceites de responsável pendentes"
          }
          estilo="amarelo"
        />
      </ul>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Suspense>
            <Pedidos />
          </Suspense>

          <section
            aria-labelledby="progresso-dos-alunos"
            className={`${cartao} min-w-0 overflow-hidden`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 px-6 pt-5 pb-2">
              <h2 id="progresso-dos-alunos" className={tituloDeCartao}>
                Progresso dos alunos
              </h2>
              <Link
                href="/professor/alunos"
                className="inline-flex min-h-12 items-center text-sm font-bold text-bordo underline"
              >
                Ver todos
              </Link>
            </div>
            {linhas.length === 0 ? (
              <p className="px-6 pb-6 text-texto-secundario">
                Nenhum aluno cadastrado ainda.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[46rem] text-left text-sm">
                  <thead className="border-b border-linha text-xs font-bold text-texto-secundario">
                    <tr>
                      <th scope="col" className="px-6 py-3">
                        Aluno
                      </th>
                      <th scope="col" className="px-3 py-3">
                        Curso
                      </th>
                      <th scope="col" className="px-3 py-3">
                        Progresso
                      </th>
                      <th scope="col" className="px-3 py-3">
                        Última aula
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Situação
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-linha">
                    {linhas.map(
                      ({ aluno, avatar, situacao, registros, curso }) => {
                        const resumo = curso
                          ? resumoParaProfessor(curso.modulos, registros)
                          : null;
                        const ultima = curso
                          ? ultimaAulaNoCurso(curso, registros)
                          : null;
                        const etiqueta = ETIQUETAS[situacao];
                        return (
                          <tr key={`${aluno.id}-${curso?.id ?? "sem-curso"}`}>
                            <td className="px-6 py-3">
                              <Link
                                href={`/professor/progresso/${aluno.id}`}
                                className="flex min-h-12 items-center gap-3 font-bold text-texto hover:underline"
                              >
                                <span
                                  aria-hidden="true"
                                  className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatar}`}
                                >
                                  {iniciais(aluno.nome)}
                                </span>
                                <span className="break-words">
                                  {aluno.nome}
                                </span>
                              </Link>
                            </td>
                            <td className="px-3 py-3 break-words">
                              {curso ? (
                                <>
                                  {curso.titulo}
                                  {!curso.publicado && (
                                    <span className="text-texto-secundario">
                                      {" "}
                                      (rascunho)
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-texto-secundario">
                                  Sem matrículas
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              {curso && resumo ? (
                                <div className="flex min-w-36 items-center gap-3">
                                  <div className="flex-1">
                                    <BarraProgresso
                                      percentual={resumo.percentual}
                                      rotulo={`Progresso de ${aluno.nome} em ${curso.titulo}`}
                                      cor="bordo"
                                      comTexto={false}
                                    />
                                  </div>
                                  <span>{resumo.percentual}%</span>
                                </div>
                              ) : (
                                <span aria-label="Sem progresso">—</span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              {ultima ?? (
                                <span aria-label="Nenhuma aula concluída">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-3">
                              <span
                                className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${etiqueta.classe}`}
                              >
                                {etiqueta.texto}
                              </span>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section
            aria-labelledby="recusados-recentes"
            className={`${cartao} space-y-4 p-6`}
          >
            <h2 id="recusados-recentes" className={tituloDeCartao}>
              Recusados recentemente
            </h2>
            <Suspense fallback={<p>Carregando…</p>}>
              <Recusados />
            </Suspense>
          </section>
        </div>

        <Suspense>
          <UltimoRecado />
        </Suspense>
      </div>
    </>
  );
}

async function UltimoRecado() {
  await exigirProfessor();

  const resultado = await ultimoRecado();
  return (
    <section
      aria-labelledby="ultimo-recado"
      className="flex flex-col gap-4 self-start rounded-3xl bg-amarelo-claro p-6 text-texto-sobre-amarelo"
    >
      <h2 id="ultimo-recado" className="font-titulo text-2xl">
        Último recado
      </h2>
      {"erro" in resultado ? (
        <p role="alert" className="text-sm">
          Não foi possível carregar o último recado.
        </p>
      ) : resultado.recado ? (
        <div className="space-y-1">
          <p className="font-bold break-words">{resultado.recado.titulo}</p>
          <p className="text-sm">
            Enviado para{" "}
            {resultado.recado.curso_id
              ? `alunos de ${resultado.recado.cursos?.titulo ?? "um curso"}`
              : "todos os alunos"}{" "}
            · {quandoFoi(resultado.recado.publicado_em)}
          </p>
        </div>
      ) : (
        <p className="text-sm">Nenhum recado enviado ainda.</p>
      )}
      <Link href="/professor/avisos" className={classesDoBotao("primario")}>
        Novo recado
      </Link>
    </section>
  );
}

// Quem pediu acesso (pelo Google ou pelo e-mail) e ainda espera liberação, do
// mais antigo ao mais novo. A conta criada e nunca confirmada fica de fora.
async function Pedidos() {
  await exigirProfessor();

  const supabase = await criarClienteServidor();
  const { data: pedidos, error } = await supabase
    .from("perfis")
    .select("id, nome, email, pedido_em")
    .eq("papel", "aluno")
    .is("liberado_em", null)
    .not("pedido_em", "is", null)
    .order("pedido_em");
  if (error || !pedidos)
    return (
      <ErroAoCarregar>
        Não foi possível carregar os pedidos de acesso.
      </ErroAoCarregar>
    );
  return <PedidosDeAcesso pedidos={pedidos} />;
}

async function Recusados() {
  await exigirProfessor();

  const supabase = await criarClienteServidor();
  const { data: recusas, error } = await supabase.rpc(
    "listar_recusas_recentes",
  );
  if (error || !recusas)
    return (
      <ErroAoCarregar>
        Não foi possível carregar as recusas recentes.
      </ErroAoCarregar>
    );
  return <RecusadosRecentes recusas={recusas} />;
}

async function Painel() {
  const sessao = await exigirProfessor();

  return (
    <>
      <CabecalhoDoProfessor nome={sessao.nome} atual="painel" />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:gap-8 md:px-8 md:py-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-bordo">{dataPorExtenso()}</p>
            <h1 className="font-titulo text-4xl break-words text-texto md:text-5xl">
              Olá, {sessao.nome}
            </h1>
          </div>
          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <Link
              href="/professor/alunos"
              className={classesDoBotao("secundario", "sm:w-auto")}
            >
              <Icone caminho="M3 6h18v12H3z M3 7l9 6 9-6" />
              Convidar aluno
            </Link>
            <Link
              href="/professor/cursos"
              className={classesDoBotao("primario", "sm:w-auto")}
            >
              <span className="text-amarelo">
                <Icone caminho="M12 5v14 M5 12h14" />
              </span>
              Nova aula
            </Link>
          </div>
        </header>

        <Suspense fallback={<p>Carregando…</p>}>
          <Resumo />
        </Suspense>
      </main>
      <footer className="mx-auto w-full max-w-6xl px-4 pb-6 md:px-8">
        <Link
          href="/privacidade"
          className="inline-flex min-h-12 items-center text-sm text-texto-secundario underline"
        >
          Política de privacidade
        </Link>
      </footer>
    </>
  );
}

export default function PainelProfessor() {
  return (
    <div data-tela-cheia className="flex flex-1 flex-col">
      <Suspense fallback={<p className="p-8">Carregando…</p>}>
        <Painel />
      </Suspense>
    </div>
  );
}
