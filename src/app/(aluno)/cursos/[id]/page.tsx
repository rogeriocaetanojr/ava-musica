import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BarraProgresso } from "@/components/barra-progresso";
import { exigirAlunoOuProfessor } from "@/lib/auth";
import { ordenar } from "@/lib/ordem";
import { type ModuloDoCurso, resumoDoCurso } from "@/lib/progresso";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { ehUuid } from "../../../professor/cursos/validacao";
import { aulasConcluidas } from "../../dados";
import { avisoPreVisualizacao, botaoPrincipal } from "../../estilos";

type Aula = { id: string; titulo: string; ordem: number; publicada: boolean };
type Modulo = ModuloDoCurso<Aula> & { titulo: string };
type Curso = {
  id: string;
  titulo: string;
  instrumento: string;
  nivel: string | null;
  descricao: string | null;
  modulos: Modulo[];
};

async function PaginaDoCurso({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirAlunoOuProfessor();
  const { id } = await params;
  if (!ehUuid(id)) notFound();

  const supabase = await criarClienteServidor();
  const [{ data }, concluidas] = await Promise.all([
    supabase
      .from("cursos")
      .select(
        "id, titulo, instrumento, nivel, descricao, modulos (id, titulo, ordem, aulas (id, titulo, ordem, publicada))",
      )
      .eq("id", id)
      .eq("publicado", true)
      .maybeSingle(),
    aulasConcluidas(sessao.id),
  ]);
  if (!data) notFound();

  const curso = data as unknown as Curso;
  const resumo = resumoDoCurso(curso.modulos, concluidas);

  return (
    <>
      <Link href="/cursos" className="text-base underline">
        ← Meus cursos
      </Link>

      {sessao.papel === "professor" && (
        <p className={avisoPreVisualizacao}>
          Pré-visualização do aluno. Rascunhos não aparecem.
        </p>
      )}

      <header className="space-y-2">
        <h1 className="text-2xl font-bold break-words">{curso.titulo}</h1>
        <p className="text-base">
          {curso.instrumento}
          {curso.nivel ? ` · ${curso.nivel}` : ""}
        </p>
        {curso.descricao && (
          <p className="text-base break-words whitespace-pre-wrap">
            {curso.descricao}
          </p>
        )}
      </header>

      <BarraProgresso
        percentual={resumo.percentual}
        rotulo={`Progresso em ${curso.titulo}`}
      />
      {resumo.proxima && (
        <Link href={`/aulas/${resumo.proxima.id}`} className={botaoPrincipal}>
          {resumo.concluidas === 0 ? "Começar" : "Continuar"}
        </Link>
      )}

      {ordenar(curso.modulos).map((modulo) => {
        const aulas = ordenar(modulo.aulas.filter((aula) => aula.publicada));
        if (aulas.length === 0) return null;
        return (
          <section key={modulo.id} className="space-y-3">
            <h2 className="text-xl font-semibold break-words">
              {modulo.titulo}
            </h2>
            <ol className="space-y-2">
              {aulas.map((aula) => {
                const feita = concluidas.has(aula.id);
                return (
                  <li key={aula.id}>
                    <Link
                      href={`/aulas/${aula.id}`}
                      className="flex min-h-12 items-center gap-3 rounded-lg border border-current/30 px-4 py-3 text-lg"
                    >
                      <span
                        aria-hidden
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                          feita
                            ? "border-primaria bg-primaria text-white"
                            : "border-current/40"
                        }`}
                      >
                        {feita ? "✓" : ""}
                      </span>
                      <span className="break-words">{aula.titulo}</span>
                      {feita && <span className="sr-only">(concluída)</span>}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}

      {resumo.total === 0 && <p className="text-lg">Nenhuma aula ainda.</p>}
    </>
  );
}

export default function Curso({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <Suspense fallback={<p>Carregando…</p>}>
        <PaginaDoCurso params={params} />
      </Suspense>
    </main>
  );
}
