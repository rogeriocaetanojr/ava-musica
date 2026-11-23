import Link from "next/link";
import { CONTEINER } from "@/components/conteiner";
import { Suspense } from "react";
import { Aviso } from "@/components/aviso";
import { BarraProgresso } from "@/components/barra-progresso";
import { classesDoBotao } from "@/components/botao";
import { Rodape } from "@/components/rodape";
import { AbasDoAluno } from "@/components/abas-do-aluno";
import { CabecalhoDoAluno } from "@/components/cabecalho-do-aluno";
import { ID_DOS_RECADOS, type Recado } from "@/components/sino-de-recados";
import { BocaDoViolao, Cordas } from "@/components/cordas";
import {
  CartaoDoCurso,
  type CursoDoAluno as Curso,
  SELECT_DOS_CURSOS,
} from "../cartao-do-curso";
import { exigirAlunoOuProfessor } from "@/lib/auth";
import { formatarDataHora, saudacao } from "@/lib/datas";
import { ordenar } from "@/lib/ordem";
import { aulasEmOrdem, resumoDoCurso } from "@/lib/progresso";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { aulasConcluidas, recadosDoAluno, ultimaAulaEstudada } from "../dados";

type Aviso = Recado;

const rotuloDeSecao = "text-sm font-bold text-destaque";

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
      className="relative flex flex-col justify-center overflow-hidden rounded-3xl border border-borda-cartao bg-bordo p-6 text-sobre-bordo md:min-h-[34dvh] 2xl:min-h-[40dvh] md:px-10 md:py-7 md:pr-48 2xl:py-9 2xl:pr-56"
    >
      {/* No computador, a altura acompanha a tela para preencher o espaço
          sem passar dela em 1366×768. */}
      <Cordas className="absolute inset-y-0 right-4 w-16 md:right-16 md:w-28" />
      <BocaDoViolao className="absolute top-1/2 right-10 hidden size-32 -translate-y-1/2 md:block 2xl:right-12 2xl:size-36" />

      <div className="relative space-y-4 md:space-y-5">
        <div className="space-y-2">
          <h2 id="continuar" className="text-sm font-bold text-amarelo">
            {proxima ? "Continue de onde parou" : "Curso concluído"}
          </h2>
          <p className="pr-14 font-titulo text-3xl break-words md:pr-0 md:text-3xl 2xl:text-5xl">
            {proxima ? proxima.titulo : curso.titulo}
          </p>
          <p className="pr-14 text-base text-amarelo-claro md:pr-0 md:text-lg">
            {proxima ? (
              <>
                {curso.titulo} ·{" "}
                <span className="hidden md:inline">
                  {modulo?.titulo ?? ""} ·{" "}
                </span>
                Aula {numero} de {resumo.total}
              </>
            ) : (
              "Você concluiu todas as aulas. Pode rever quando quiser."
            )}
          </p>
        </div>
        <div className="flex max-w-xl items-center gap-4 pr-14 md:pr-0">
          <div className="flex-1">
            <BarraProgresso
              percentual={resumo.percentual}
              rotulo={`Andamento de ${curso.titulo}`}
              cor="amarelo"
              comTexto={false}
              grossa
            />
          </div>
          <span className="text-base font-bold">{resumo.percentual}%</span>
        </div>
        <Link
          href={proxima ? `/aulas/${proxima.id}` : `/cursos/${curso.id}`}
          className={classesDoBotao("destaque", "md:w-auto")}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 12 12"
            className="size-3"
            fill="currentColor"
          >
            <path d="M2 1l9 5-9 5z" />
          </svg>
          {proxima ? (
            <span>
              Continuar<span className="hidden md:inline"> aula</span>
            </span>
          ) : (
            "Ver o curso"
          )}
        </Link>
      </div>
    </section>
  );
}

// Sem recados, o cartão mostra um estado vazio para a coluna da direita não
// sobrar em branco; nesse caso só aparece a partir de lg, ao lado do Continue.
function RecadosDoProfessor({ avisos }: { avisos: Aviso[] }) {
  const vazio = avisos.length === 0;
  return (
    <section
      aria-labelledby="recados-recentes"
      className={`hidden flex-col gap-5 rounded-3xl bg-bloco p-7 text-texto-sobre-bloco ${
        vazio ? "lg:flex" : "md:flex"
      }`}
    >
      <h2 id="recados-recentes" className="text-sm font-bold">
        Recados recentes
      </h2>
      {vazio ? (
        <p className="text-base">Nenhum recado novo por enquanto.</p>
      ) : (
        <>
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
          <button
            type="button"
            popoverTarget={ID_DOS_RECADOS}
            className="mt-auto inline-flex min-h-12 cursor-pointer items-center self-end text-sm font-bold text-destaque"
          >
            Ver todos os recados
          </button>
        </>
      )}
    </section>
  );
}

// No celular, só o recado mais recente; o toque abre o painel de recados.
function RecadoMaisRecente({ aviso }: { aviso: Aviso }) {
  return (
    <button
      type="button"
      popoverTarget={ID_DOS_RECADOS}
      className="flex min-h-12 w-full cursor-pointer items-center gap-4 rounded-3xl bg-bloco p-5 text-left text-texto-sobre-bloco md:hidden"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-6 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </svg>
      <span className="min-w-0">
        <span className="block text-base font-bold break-words">
          {aviso.titulo}
        </span>
        <span className="block text-base">Recado do professor</span>
      </span>
    </button>
  );
}

async function MeusCursosDoAluno() {
  const sessao = await exigirAlunoOuProfessor();
  const professor = sessao.papel === "professor";

  // A RLS já limita o aluno aos cursos publicados em que está matriculado;
  // o filtro de publicado vale para a pré-visualização do professor.
  // Os avisos também são filtrados pela RLS: gerais e dos cursos matriculados.
  const supabase = await criarClienteServidor();
  const [{ data }, concluidas, ultimaAula, avisos] = await Promise.all([
    supabase
      .from("cursos")
      .select(SELECT_DOS_CURSOS)
      .eq("publicado", true)
      .order("titulo"),
    aulasConcluidas(sessao.id),
    ultimaAulaEstudada(sessao.id),
    recadosDoAluno(),
  ]);
  const cursos = (data ?? []) as unknown as Curso[];
  const continuar = cursoParaContinuar(cursos, ultimaAula);

  return (
    <>
      <CabecalhoDoAluno
        nome={sessao.nome}
        atual="cursos"
        recados={avisos}
        professor={professor}
      />

      <main
        className={`${CONTEINER} flex max-w-6xl flex-1 flex-col gap-5 py-5 md:py-5 2xl:gap-8 2xl:py-8`}
      >
        <header className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-titulo text-3xl break-words">
            <span className="block text-sm font-bold text-destaque md:inline md:font-titulo md:text-3xl md:font-normal">
              {saudacao()}
              <span className="hidden md:inline">, </span>
            </span>
            {sessao.nome}
          </h1>
        </header>

        {professor && (
          <Aviso>
            Pré-visualização: você vê os cursos publicados como um aluno, sem
            registrar progresso.
          </Aviso>
        )}

        {(continuar || avisos.length > 0) && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
            {continuar && (
              <ContinueDeOndeParou curso={continuar} concluidas={concluidas} />
            )}
            <RecadosDoProfessor avisos={avisos} />
            {avisos.length > 0 && <RecadoMaisRecente aviso={avisos[0]} />}
          </div>
        )}

        <section aria-labelledby="meus-cursos" className="space-y-3">
          <h2 id="meus-cursos" className={rotuloDeSecao}>
            Meus cursos
          </h2>
          {cursos.length === 0 ? (
            <p className="rounded-2xl border border-linha bg-superficie p-6 text-lg">
              Você ainda não tem cursos por aqui. Assim que o professor liberar
              seus cursos, eles aparecem nesta página.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 2xl:gap-8">
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
      </main>
    </>
  );
}

// A área do aluno traz o próprio cabeçalho; o da moldura do site some.
export default function MeusCursos() {
  return (
    <div data-tela-cheia className="flex min-h-dvh flex-1 flex-col">
      <div className="flex flex-1 flex-col">
        <Suspense fallback={<p className="p-8">Carregando…</p>}>
          <MeusCursosDoAluno />
        </Suspense>
      </div>
      <Rodape largura="max-w-6xl" />
      <AbasDoAluno atual="cursos" />
    </div>
  );
}
