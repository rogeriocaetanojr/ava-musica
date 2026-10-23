import Link from "next/link";
import { CONTEINER } from "@/components/conteiner";
import { Suspense } from "react";
import { Aviso } from "@/components/aviso";
import { BarraProgresso } from "@/components/barra-progresso";
import { AbasDoProfessor } from "@/components/abas-do-professor";
import { classesDoBotao } from "@/components/botao";
import { CabecalhoDoProfessor } from "@/components/cabecalho-do-professor";
import { Cordas } from "@/components/cordas";
import { exigirProfessor } from "@/lib/auth";
import { dataPorExtenso, quandoFoi } from "@/lib/datas";
import { iniciais, primeiroNome } from "@/lib/nomes";
import {
  type SituacaoDoAluno,
  aulasConcluidasNaSemana,
  resumoParaProfessor,
  situacaoDoAluno,
} from "@/lib/painel";
import { aulasEmOrdem } from "@/lib/progresso";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import {
  type CursoDoPainel,
  type ProgressoDoPainel,
  dadosDoPainel,
  situacaoDosAlunos,
} from "./progresso/dados";

const cartao = "rounded-3xl border border-linha bg-superficie";
const tituloDeCartao = "font-titulo text-2xl text-texto";

// Cores dos avatares, alternadas pela ordem da lista.
const AVATARES = [
  "bg-bordo text-amarelo",
  "bg-amarelo text-texto-sobre-amarelo",
  "bg-amarelo-claro text-texto-sobre-amarelo",
  "bg-vinho text-amarelo-claro",
];

const ETIQUETAS: Record<SituacaoDoAluno, { texto: string; classe: string }> = {
  ativo: { texto: "Ativo", classe: "bg-linha text-bordo" },
  aguardando: {
    texto: "Aguardando responsável",
    classe: "bg-amarelo-claro text-texto-sobre-amarelo",
  },
  bloqueado: { texto: "Bloqueado", classe: "bg-vinho text-superficie" },
};

const faixa =
  "flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-amarelo-claro px-5 py-3 text-sm font-bold text-texto-sobre-amarelo";

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
  compacto = false,
}: {
  numero: number;
  rotulo: string;
  estilo?: "claro" | "bordo" | "amarelo";
  compacto?: boolean;
}) {
  const fundo = {
    claro: "border-linha bg-superficie text-texto",
    bordo: "border-bordo bg-bordo text-superficie",
    amarelo: "border-amarelo bg-amarelo-claro text-texto-sobre-amarelo",
  }[estilo];
  return (
    <li
      className={`relative overflow-hidden rounded-3xl border ${compacto ? "p-5" : "p-6"} ${fundo}`}
    >
      {estilo === "bordo" && !compacto && (
        <Cordas className="absolute inset-y-0 right-6 w-24 border-l border-vinho pl-5" />
      )}
      <p className="relative flex flex-col gap-2">
        <span
          className={`font-titulo ${compacto ? "text-4xl" : "text-5xl"} ${
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

// Nova aula e Convidar lado a lado, logo abaixo dos indicadores no celular.
function AcoesDoCelular() {
  return (
    <div className="grid grid-cols-2 gap-3 md:hidden">
      <Link href="/professor/cursos" className={classesDoBotao("primario")}>
        <span className="text-amarelo">
          <Icone caminho="M12 5v14 M5 12h14" />
        </span>
        Nova aula
      </Link>
      <Link
        href="/professor/alunos/convidar"
        className={classesDoBotao("secundario")}
      >
        Convidar
      </Link>
    </div>
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
      <>
        <ErroAoCarregar>
          Não foi possível carregar o progresso dos alunos.
        </ErroAoCarregar>
        <AcoesDoCelular />
      </>
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
      variosCursos: cursos.length > 1,
    };
    const comCurso: (typeof base & { curso: CursoDoPainel | null })[] =
      cursos.length === 0
        ? [{ ...base, curso: null }]
        : cursos.map((curso) => ({ ...base, curso }));
    return comCurso;
  });

  return (
    <>
      <ul aria-label="Indicadores" className="grid grid-cols-2 gap-3 md:hidden">
        <Indicador
          numero={ativos}
          rotulo={ativos === 1 ? "aluno ativo" : "alunos ativos"}
          estilo="bordo"
          compacto
        />
        <Indicador
          numero={publicados}
          rotulo={publicados === 1 ? "curso no ar" : "cursos no ar"}
          compacto
        />
      </ul>

      {aceitesPendentes > 0 && (
        <Link href="/professor/alunos" className={`${faixa} md:hidden`}>
          {aceitesPendentes === 1
            ? "1 aceite de responsável pendente"
            : `${aceitesPendentes} aceites de responsável pendentes`}
          <span aria-hidden="true">›</span>
        </Link>
      )}

      <Suspense>
        <FaixaDePedidos />
      </Suspense>

      <AcoesDoCelular />

      <ul
        aria-label="Indicadores"
        className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4"
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

      <div className="flex min-w-0 flex-col gap-6">
        <section
          aria-labelledby="progresso-dos-alunos-celular"
          className="md:hidden"
        >
          <h2
            id="progresso-dos-alunos-celular"
            className="pb-3 text-base font-bold text-bordo"
          >
            Progresso dos alunos
          </h2>
          {linhas.length === 0 ? (
            <p className="border-t border-linha pt-3 text-texto-secundario">
              Nenhum aluno cadastrado ainda.
            </p>
          ) : (
            <ul className="divide-y divide-linha border-t border-linha">
              {linhas.map(
                ({
                  aluno,
                  avatar,
                  situacao,
                  registros,
                  curso,
                  variosCursos,
                }) => {
                  const resumo = curso
                    ? resumoParaProfessor(curso.modulos, registros)
                    : null;
                  return (
                    <li key={`${aluno.id}-${curso?.id ?? "sem-curso"}`}>
                      <Link
                        href={`/professor/progresso/${aluno.id}`}
                        className="flex min-h-12 items-center gap-4 py-3"
                      >
                        <span
                          aria-hidden="true"
                          className={`inline-flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatar}`}
                        >
                          {iniciais(aluno.nome)}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="font-bold break-words text-texto">
                            {aluno.nome}
                          </span>
                          {/* Com um curso só, a linha fica como no
                              protótipo; o curso aparece para diferenciar as
                              linhas de quem tem vários, e sem matrícula. */}
                          {(variosCursos || !curso) && (
                            <span className="text-sm break-words text-texto-secundario">
                              {curso ? (
                                <>
                                  {curso.titulo}
                                  {!curso.publicado && " (rascunho)"}
                                </>
                              ) : (
                                "Sem matrículas"
                              )}
                            </span>
                          )}
                          {situacao !== "ativo" ? (
                            <span
                              className={`self-start rounded-full px-3 py-1 text-xs font-bold ${ETIQUETAS[situacao].classe}`}
                            >
                              {ETIQUETAS[situacao].texto}
                            </span>
                          ) : (
                            curso &&
                            resumo && (
                              <BarraProgresso
                                percentual={resumo.percentual}
                                rotulo={`Progresso de ${aluno.nome} em ${curso.titulo}`}
                                cor="bordo"
                                comTexto={false}
                              />
                            )
                          )}
                        </span>
                        {situacao === "ativo" && resumo && (
                          <span className="shrink-0 font-titulo text-xl text-texto">
                            {resumo.percentual}%
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                },
              )}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="progresso-dos-alunos"
          className={`${cartao} hidden min-w-0 overflow-hidden md:block`}
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
                              <span className="break-words">{aluno.nome}</span>
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
                              <span aria-label="Nenhuma aula concluída">—</span>
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
      </div>
    </>
  );
}

// Quem pediu acesso (pelo Google ou pelo e-mail) e ainda espera liberação. A
// faixa leva à página Alunos, onde o professor libera ou recusa; sem pedidos,
// ou se a contagem falhar, ela não aparece.
async function FaixaDePedidos() {
  await exigirProfessor();

  const supabase = await criarClienteServidor();
  const { count, error } = await supabase
    .from("perfis")
    .select("id", { count: "exact", head: true })
    .eq("papel", "aluno")
    .is("liberado_em", null)
    .not("pedido_em", "is", null);
  if (error || !count) return null;
  return (
    <Link href="/professor/alunos" className={faixa}>
      {count === 1 ? "1 pedido de acesso" : `${count} pedidos de acesso`}
      <span aria-hidden="true">›</span>
    </Link>
  );
}

async function Painel() {
  const sessao = await exigirProfessor();

  return (
    <>
      <CabecalhoDoProfessor nome={sessao.nome} atual="painel" />
      <main
        className={`${CONTEINER} flex max-w-6xl flex-1 flex-col gap-6 py-6 md:gap-8 md:py-10`}
      >
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="hidden text-sm font-bold text-bordo md:block">
              {dataPorExtenso()}
            </p>
            <h1 className="font-titulo text-4xl break-words text-texto md:text-5xl">
              Olá, {primeiroNome(sessao.nome)}
            </h1>
          </div>
          <div className="hidden w-auto flex-wrap gap-3 md:flex">
            <Link
              href="/professor/alunos/convidar"
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
      <footer
        className={`${CONTEINER} flex max-w-6xl flex-wrap items-center gap-x-6 pb-6`}
      >
        <Link
          href="/privacidade"
          className="inline-flex min-h-12 items-center text-sm text-texto-secundario underline"
        >
          Política de privacidade
        </Link>
        <Link
          href="/cursos"
          className="inline-flex min-h-12 items-center text-sm text-texto-secundario underline md:hidden"
        >
          Ver como aluno
        </Link>
        <form action="/auth/sair" method="post" className="md:hidden">
          <button
            type="submit"
            className="inline-flex min-h-12 items-center text-sm text-texto-secundario underline"
          >
            Sair
          </button>
        </form>
      </footer>
      <AbasDoProfessor atual="painel" />
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
