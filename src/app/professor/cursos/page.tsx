import Link from "next/link";
import { TelaDoProfessor } from "@/components/tela-do-professor";
import { CONTEINER } from "@/components/conteiner";
import { Suspense } from "react";
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
};

async function ListaDeCursos() {
  await exigirProfessor();

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("cursos")
    .select("id, titulo, instrumento, nivel, publicado")
    .order("titulo");

  if (error)
    return (
      <p role="alert" className="rounded-md bg-red-100 p-3 text-red-800">
        Não foi possível carregar os cursos.
      </p>
    );

  const cursos = (data ?? []) as CursoResumo[];
  if (cursos.length === 0) return <p>Nenhum curso criado ainda.</p>;

  return (
    <ul className="space-y-3">
      {cursos.map((curso) => (
        <li key={curso.id}>
          <Link
            href={`/professor/cursos/${curso.id}`}
            className="block rounded-md border border-current p-4"
          >
            <span className="block font-medium break-words">
              {curso.titulo}
            </span>
            <span className="text-sm">
              {curso.instrumento}
              {curso.nivel && ` · ${curso.nivel}`} ·{" "}
              {curso.publicado ? "Publicado" : "Rascunho"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function CursosDoProfessor() {
  return (
    <TelaDoProfessor atual="cursos">
      <main
        className={`${CONTEINER} flex max-w-2xl flex-1 flex-col gap-8 py-8`}
      >
        <div className="space-y-2">
          <Link href="/professor" className="text-sm underline">
            ← Painel
          </Link>
          <h1 className="text-2xl font-bold">Cursos</h1>
        </div>

        <section className="space-y-3">
          <Suspense fallback={<p>Carregando…</p>}>
            <ListaDeCursos />
          </Suspense>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Novo curso</h2>
          <FormularioCurso acao={criarCurso} textoDoBotao="Criar curso" />
        </section>
      </main>
    </TelaDoProfessor>
  );
}
