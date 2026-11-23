import Link from "next/link";
import { RodapeInterno } from "@/components/rodape";
import { CONTEINER } from "@/components/conteiner";
import { Suspense } from "react";
import { Aviso } from "@/components/aviso";
import { AbasDoProfessor } from "@/components/abas-do-professor";
import { classesDoBotao } from "@/components/botao";
import { CabecalhoDoProfessor } from "@/components/cabecalho-do-professor";
import { Cordas } from "@/components/cordas";
import { exigirProfessor } from "@/lib/auth";
import { atividadeRelativa, dataPorExtenso } from "@/lib/datas";
import { primeiroNome } from "@/lib/nomes";
import { fotosDe } from "@/lib/fotos";
import { DIAS_SEM_ATIVIDADE } from "./alunos/validacao";
import {
  type AlunoDaColuna,
  type ColunaDoCurso,
  ColunasPorCurso,
} from "./colunas-por-curso";

import {
  aulasConcluidasNaSemana,
  resumoParaProfessor,
  situacaoDoAluno,
} from "@/lib/painel";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import {
  type AlunoDoPainel,
  contagemDe,
  dadosDoPainel,
  situacaoDosAlunos,
} from "./progresso/dados";

const faixa =
  "flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-bloco px-5 py-3 text-sm font-bold text-texto-sobre-bloco";

const DIA_MS = 24 * 60 * 60 * 1000;

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
    bordo: "border-borda-cartao bg-bordo text-sobre-bordo",
    amarelo: "border-amarelo bg-bloco text-texto-sobre-bloco",
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
                ? "text-destaque"
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

// Colunas do painel, uma por curso publicado. Fora do componente: usa a
// hora atual para o selo "Parado".
function colunasDoPainel(
  dados: NonNullable<Awaited<ReturnType<typeof dadosDoPainel>>>,
  estudando: AlunoDoPainel[],
  fotos: Map<string, string>,
): ColunaDoCurso[] {
  const agora = Date.now();
  return dados.cursos
    .filter((curso) => curso.publicado)
    .map((curso) => {
      // Título de cada aula, para o "Parou em" (ultima_aula_id das contagens).
      const tituloDaAula = new Map(
        curso.modulos.flatMap((m) => m.aulas.map((a) => [a.id, a.titulo])),
      );
      const alunos: AlunoDaColuna[] = estudando.flatMap((aluno) => {
        const matricula = aluno.matriculas.find((m) => m.curso_id === curso.id);
        if (!matricula) return [];
        const contagem = contagemDe(dados.contagens, aluno.id, curso.id);
        // Parado: a última aula concluída no curso (ou, sem nenhuma, a
        // matrícula) passou do limite da Turma.
        const desde = contagem?.ultima_aula_em ?? matricula.criado_em;
        const dias = (agora - Date.parse(desde)) / DIA_MS;
        const resumo = resumoParaProfessor(curso.modulos, contagem);
        return [
          {
            id: aluno.id,
            nome: aluno.nome,
            foto: fotos.get(aluno.id) ?? null,
            percentual: resumo.percentual,
            concluidas: resumo.concluidas,
            total: resumo.total,
            parouEm: contagem?.ultima_aula_id
              ? (tituloDaAula.get(contagem.ultima_aula_id) ?? null)
              : null,
            parado: dias > DIAS_SEM_ATIVIDADE,
            // Última aula concluída no curso (progresso_por_curso).
            ultimaAtividade: contagem?.ultima_aula_em ?? null,
            quando: contagem?.ultima_aula_em
              ? atividadeRelativa(contagem.ultima_aula_em, new Date(agora))
              : "",
          },
        ];
      });
      const media =
        alunos.length === 0
          ? null
          : Math.round(
              alunos.reduce((soma, x) => soma + x.percentual, 0) /
                alunos.length,
            );
      const ultimaAtividade =
        alunos
          .flatMap((x) => (x.ultimaAtividade ? [x.ultimaAtividade] : []))
          .sort()
          .at(-1) ?? null;
      return {
        id: curso.id,
        titulo: curso.titulo,
        alunos,
        media,
        ultimaAtividade,
      };
    });
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
  const naSemana = aulasConcluidasNaSemana(dados.contagens);

  // Uma coluna por curso publicado, com o progresso de cada aluno naquele
  // curso, das contagens do banco (progresso_por_curso). Bloqueados ficam de
  // fora: não estão estudando.
  const estudando = dados.alunos.filter(
    (a) => situacaoDe(a.id) !== "bloqueado",
  );
  const fotos = await fotosDe(estudando.map((a) => a.id));
  const colunas = colunasDoPainel(dados, estudando, fotos);

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

      <ColunasPorCurso colunas={colunas} />
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
    .not("pedido_em", "is", null)
    .not("nome", "is", null);
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
            <p className="hidden text-sm font-bold text-destaque md:block">
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
      <RodapeInterno />
      <AbasDoProfessor atual="painel" />
    </>
  );
}

export default function PainelProfessor() {
  return (
    <div data-tela-cheia className="flex min-h-dvh flex-1 flex-col">
      <Suspense fallback={<p className="p-8">Carregando…</p>}>
        <Painel />
      </Suspense>
    </div>
  );
}
