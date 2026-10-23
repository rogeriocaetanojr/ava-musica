import Link from "next/link";
import { Suspense } from "react";
import { BarraProgresso } from "@/components/barra-progresso";
import { classesDoBotao } from "@/components/botao";
import { CabecalhoDoAluno } from "@/components/cabecalho-do-aluno";
import { BocaDoViolao, Cordas } from "@/components/cordas";
import { exigirAlunoOuProfessor } from "@/lib/auth";
import { formatarDataHora, saudacao } from "@/lib/datas";
import { ordenar } from "@/lib/ordem";
import {
  type AulaDoCurso,
  type ModuloDoCurso,
  aulasEmOrdem,
  resumoDoCurso,
} from "@/lib/progresso";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { aulasConcluidas, ultimaAulaEstudada } from "../dados";
import { avisoPreVisualizacao } from "../estilos";

type Aula = AulaDoCurso & { titulo: string };
type Modulo = ModuloDoCurso<Aula> & { titulo: string };
type Curso = {
  id: string;
  titulo: string;
  instrumento: string;
  nivel: string | null;
  modulos: Modulo[];
};
type Aviso = {
  id: string;
  titulo: string;
  texto: string;
  publicado_em: string;
  cursos: { titulo: string } | null;
};

// Capas alternadas pela ordem da lista; as cordas mudam de cor no amarelo.
const CAPAS = [
  { fundo: "bg-bordo", cordas: "amarelo" },
  { fundo: "bg-amarelo", cordas: "vinho" },
  { fundo: "bg-vinho", cordas: "amarelo" },
] as const;

const rotuloDeSecao = "text-sm font-bold text-bordo";

// Curso do "Continue de onde parou": o da aula estudada por último ou, sem
// progresso, o primeiro curso que tem aulas.
function cursoParaContinuar(
  cursos: Curso[],
  ultimaAula: string | null,
): Curso | null {
  const comAulas = cursos.filter((c) => aulasEmOrdem(c.modulos).length > 0);
  return (
    comAulas.find((c) =>
      c.modulos.some((m) => m.aulas.some((a) => a.id === ultimaAula)),
    ) ??
    comAulas[0] ??
    null
  );
}

function ContinueDeOndeParou({
  curso,
  concluidas,
}: {
  curso: Curso;
  concluidas: Set<string>;
}) {
  const resumo = resumoDoCurso(curso.modulos, concluidas);
  const proxima = resumo.proxima;
  const modulo = proxima
    ? ordenar(curso.modulos).find((m) =>
        m.aulas.some((a) => a.id === proxima.id),
      )
    : undefined;
  const numero = proxima
    ? aulasEmOrdem(curso.modulos).findIndex((a) => a.id === proxima.id) + 1
    : 0;

  return (
    <section
      aria-labelledby="continuar"
      className="relative overflow-hidden rounded-3xl bg-bordo p-8 text-superficie md:pr-56"
    >
      <Cordas className="absolute inset-y-0 right-14 hidden w-26 md:flex" />
      <BocaDoViolao className="absolute top-1/2 right-10 hidden size-32 -translate-y-1/2 md:block" />

      <div className="relative space-y-4">
        <h2 id="continuar" className="text-sm font-bold text-amarelo">
          {proxima ? "Continue de onde parou" : "Curso concluído"}
        </h2>
        <p className="font-titulo text-4xl break-words">
          {proxima ? proxima.titulo : curso.titulo}
        </p>
        <p className="text-base text-amarelo-claro">
          {proxima
            ? `${curso.titulo} · ${modulo?.titulo ?? ""} · Aula ${numero} de ${resumo.total}`
            : "Você concluiu todas as aulas deste curso. Pode rever quando quiser."}
        </p>
        <div className="flex max-w-md items-center gap-3">
          <div className="flex-1">
            <BarraProgresso
              percentual={resumo.percentual}
              rotulo={`Andamento de ${curso.titulo}`}
              cor="amarelo"
              comTexto={false}
            />
          </div>
          <span className="text-sm font-bold">{resumo.percentual}%</span>
        </div>
        <Link
          href={proxima ? `/aulas/${proxima.id}` : `/cursos/${curso.id}`}
          className={classesDoBotao("destaque", "sm:w-auto")}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 12 12"
            className="size-3"
            fill="currentColor"
          >
            <path d="M2 1l9 5-9 5z" />
          </svg>
          {proxima ? "Continuar aula" : "Ver o curso"}
        </Link>
      </div>
    </section>
  );
}

function RecadosDoProfessor({ avisos }: { avisos: Aviso[] }) {
  return (
    <section
      aria-labelledby="recados-recentes"
      className="flex flex-col gap-5 rounded-3xl bg-amarelo-claro p-7 text-texto-sobre-amarelo"
    >
      <h2 id="recados-recentes" className="text-sm font-bold">
        Recados do professor
      </h2>
      <ul className="space-y-4">
        {avisos.slice(0, 2).map((aviso) => (
          <li key={aviso.id} className="flex gap-3">
            <span
              aria-hidden="true"
              className="mt-2 size-2.5 shrink-0 rounded-full bg-bordo"
            />
            <div className="min-w-0">
              <h3 className="text-base font-bold break-words">
                {aviso.titulo}
              </h3>
              <p className="line-clamp-2 text-sm break-words">
                {aviso.texto} · {formatarDataHora(aviso.publicado_em)}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <Link
        href="#recados"
        className="mt-auto inline-flex min-h-12 items-center self-start text-sm font-bold underline"
      >
        Ver todos os recados
      </Link>
    </section>
  );
}

function CartaoDoCurso({
  curso,
  posicao,
  concluidas,
}: {
  curso: Curso;
  posicao: number;
  concluidas: Set<string>;
}) {
  const resumo = resumoDoCurso(curso.modulos, concluidas);
  const capa = CAPAS[posicao % CAPAS.length];
  const terminou = resumo.total > 0 && resumo.proxima === null;

  return (
    <li className="overflow-hidden rounded-2xl border border-linha bg-superficie">
      <Link href={`/cursos/${curso.id}`} className="block">
        <div className={`relative h-36 ${capa.fundo}`}>
          <Cordas
            cor={capa.cordas}
            className="absolute inset-y-0 left-1/3 w-20"
          />
        </div>
        <div className="space-y-3 p-5">
          <h3 className="font-titulo text-xl break-words text-texto">
            {curso.titulo}
          </h3>
          <BarraProgresso
            percentual={resumo.percentual}
            rotulo={`Progresso em ${curso.titulo}`}
            cor="bordo"
            comTexto={false}
          />
          <p className="text-sm text-texto-secundario">
            {terminou
              ? "Concluído"
              : `${resumo.concluidas} de ${resumo.total} ${resumo.total === 1 ? "aula" : "aulas"} · ${resumo.percentual}%`}
          </p>
        </div>
      </Link>
    </li>
  );
}

async function MeusCursosDoAluno() {
  const sessao = await exigirAlunoOuProfessor();
  const professor = sessao.papel === "professor";

  // A RLS já limita o aluno aos cursos publicados em que está matriculado;
  // o filtro de publicado vale para a pré-visualização do professor.
  // Os avisos também são filtrados pela RLS: gerais e dos cursos matriculados.
  const supabase = await criarClienteServidor();
  const [{ data }, concluidas, ultimaAula, { data: dadosAvisos }] =
    await Promise.all([
      supabase
        .from("cursos")
        .select(
          "id, titulo, instrumento, nivel, modulos (id, titulo, ordem, aulas (id, titulo, ordem, publicada))",
        )
        .eq("publicado", true)
        .order("titulo"),
      aulasConcluidas(sessao.id),
      ultimaAulaEstudada(sessao.id),
      supabase
        .from("avisos")
        .select("id, titulo, texto, publicado_em, cursos (titulo)")
        .order("publicado_em", { ascending: false }),
    ]);
  const cursos = (data ?? []) as unknown as Curso[];
  const avisos = (dadosAvisos ?? []) as unknown as Aviso[];
  const continuar = cursoParaContinuar(cursos, ultimaAula);

  return (
    <>
      <CabecalhoDoAluno nome={sessao.nome} atual="cursos" />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 md:px-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className={rotuloDeSecao}>{saudacao()}</p>
            <h1 className="font-titulo text-5xl break-words">{sessao.nome}</h1>
          </div>
          {professor && (
            <Link
              href="/professor"
              className="inline-flex min-h-12 items-center text-base font-bold underline"
            >
              Voltar ao painel
            </Link>
          )}
        </header>

        {professor && (
          <p className={avisoPreVisualizacao}>
            Pré-visualização: você vê os cursos publicados como um aluno, sem
            registrar progresso.
          </p>
        )}

        {(continuar || avisos.length > 0) && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
            {continuar && (
              <ContinueDeOndeParou curso={continuar} concluidas={concluidas} />
            )}
            {avisos.length > 0 && <RecadosDoProfessor avisos={avisos} />}
          </div>
        )}

        <section aria-labelledby="meus-cursos" className="space-y-5">
          <h2 id="meus-cursos" className={rotuloDeSecao}>
            Meus cursos
          </h2>
          {cursos.length === 0 ? (
            <p className="rounded-2xl border border-linha bg-superficie p-6 text-lg">
              Você ainda não tem cursos por aqui. Assim que o professor liberar
              seus cursos, eles aparecem nesta página.
            </p>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {cursos.map((curso, posicao) => (
                <CartaoDoCurso
                  key={curso.id}
                  curso={curso}
                  posicao={posicao}
                  concluidas={concluidas}
                />
              ))}
            </ul>
          )}
        </section>

        {avisos.length > 0 && (
          <section
            id="recados"
            aria-labelledby="todos-os-recados"
            className="scroll-mt-6 space-y-4"
          >
            <h2 id="todos-os-recados" className={rotuloDeSecao}>
              Todos os recados
            </h2>
            <ul className="space-y-3">
              {avisos.map((aviso) => (
                <li
                  key={aviso.id}
                  className="space-y-1 rounded-2xl border border-linha bg-superficie p-5"
                >
                  <h3 className="text-lg font-bold break-words">
                    {aviso.titulo}
                  </h3>
                  <p className="text-sm text-texto-secundario">
                    {aviso.cursos ? `${aviso.cursos.titulo} · ` : ""}
                    {formatarDataHora(aviso.publicado_em)}
                  </p>
                  <p className="text-base break-words whitespace-pre-line">
                    {aviso.texto}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}

// A área do aluno traz o próprio cabeçalho; o da moldura do site some.
export default function MeusCursos() {
  return (
    <div data-tela-cheia className="flex flex-1 flex-col">
      <Suspense fallback={<p className="p-8">Carregando…</p>}>
        <MeusCursosDoAluno />
      </Suspense>
      <footer className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
        <Link
          href="/privacidade"
          className="inline-flex min-h-12 items-center text-sm text-texto-secundario underline"
        >
          Política de privacidade
        </Link>
      </footer>
    </div>
  );
}
