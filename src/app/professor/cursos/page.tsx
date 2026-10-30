import Link from "next/link";
import { TelaDoProfessor } from "@/components/tela-do-professor";
import { CONTEINER } from "@/components/conteiner";
import { Suspense } from "react";
import { Cordas } from "@/components/cordas";
import { exigirProfessor } from "@/lib/auth";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { criarCurso } from "./acoes";
import { FormularioCurso } from "./formulario-curso";

type CursoResumo = {
  id: string;
  titulo: string;
  instrumento: string;
  nivel: string | null;
  publicado: boolean;
  modulos: { id: string; aulas: { id: string }[] }[];
};

const CAPAS = [
  { fundo: "bg-bordo", cordas: "amarelo" },
  { fundo: "bg-amarelo", cordas: "vinho" },
  { fundo: "bg-vinho", cordas: "amarelo" },
] as const;

function plural(quantidade: number, singular: string, varios: string) {
  return `${quantidade} ${quantidade === 1 ? singular : varios}`;
}

async function ListaDeCursos() {
  await exigirProfessor();

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("cursos")
    .select(
      "id, titulo, instrumento, nivel, publicado, modulos (id, aulas (id))",
    )
    .order("titulo");

  if (error)
    return (
      <p
        role="alert"
        className="rounded-xl bg-bloco p-4 text-texto-sobre-bloco"
      >
        Não foi possível carregar os cursos.
      </p>
    );

  const cursos = (data ?? []) as unknown as CursoResumo[];
  if (cursos.length === 0) return <p>Nenhum curso criado ainda.</p>;

  return (
    <ul className="space-y-3 md:grid md:grid-cols-2 md:gap-6 md:space-y-0 lg:grid-cols-3 lg:gap-4">
      {cursos.map((curso, posicao) => {
        const capa = CAPAS[posicao % CAPAS.length];
        const aulas = curso.modulos.reduce(
          (total, modulo) => total + modulo.aulas.length,
          0,
        );
        return (
          <li key={curso.id}>
            <Link
              href={`/professor/cursos/${curso.id}`}
              className="block overflow-hidden rounded-2xl border border-linha bg-superficie md:h-full md:overflow-hidden md:rounded-2xl md:border-linha md:bg-superficie md:p-0 md:hover:border-borda-campo lg:flex lg:flex-col"
            >
              <div
                aria-hidden="true"
                className={`relative h-14 md:h-36 lg:h-18 ${capa.fundo}`}
              >
                <Cordas
                  cor={capa.cordas}
                  className="absolute inset-y-0 left-1/3 w-12 md:w-20 lg:w-14"
                />
              </div>
              <div className="space-y-1 p-4 md:space-y-3 md:p-5 lg:flex lg:flex-1 lg:flex-col lg:space-y-1 lg:p-4">
                <span className="line-clamp-2 block font-titulo text-lg break-words text-texto md:line-clamp-none md:text-xl lg:line-clamp-2 lg:text-lg">
                  {curso.titulo}
                </span>
                <span className="block text-sm text-texto-secundario">
                  {curso.instrumento}
                  {curso.nivel && ` · ${curso.nivel}`}
                </span>
                <span className="flex flex-wrap items-center justify-between gap-2 pt-1 md:pt-0 lg:mt-auto lg:pt-2">
                  <span className="text-sm text-texto-secundario">
                    {plural(curso.modulos.length, "módulo", "módulos")} ·{" "}
                    {plural(aulas, "aula", "aulas")}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      curso.publicado
                        ? "bg-linha text-destaque"
                        : "bg-bloco text-texto-sobre-bloco"
                    }`}
                  >
                    {curso.publicado ? "Publicado" : "Rascunho"}
                  </span>
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function CursosDoProfessor() {
  return (
    <TelaDoProfessor atual="cursos">
      <main
        className={`${CONTEINER} flex max-w-2xl flex-1 flex-col gap-6 py-6 md:gap-8 md:py-10`}
      >
        <div className="space-y-2 md:flex md:flex-wrap md:items-end md:justify-between md:gap-4 md:space-y-0">
          <div className="space-y-2">
            <h1 className="font-titulo text-4xl text-texto md:text-5xl">
              Cursos
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-6 md:gap-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-6">
          <section
            aria-label="Lista de cursos"
            className="space-y-3 lg:col-span-7"
          >
            <Suspense fallback={<p>Carregando…</p>}>
              <ListaDeCursos />
            </Suspense>
          </section>

          <section
            id="novo-curso"
            aria-labelledby="titulo-novo-curso"
            className="scroll-mt-6 space-y-4 rounded-3xl border border-linha bg-superficie p-5 md:max-w-3xl md:p-6 lg:sticky lg:top-6 lg:order-first lg:col-span-5 lg:max-w-none"
          >
            <h2
              id="titulo-novo-curso"
              className="font-titulo text-2xl text-texto"
            >
              Novo curso
            </h2>
            <FormularioCurso acao={criarCurso} textoDoBotao="Criar curso" />
          </section>
        </div>
      </main>
    </TelaDoProfessor>
  );
}
