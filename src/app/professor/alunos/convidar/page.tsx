import Link from "next/link";
import { Suspense } from "react";
import { TelaDoProfessor } from "@/components/tela-do-professor";
import { CONTEINER } from "@/components/conteiner";
import { exigirProfessor } from "@/lib/auth";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { FormularioAluno } from "../formulario-aluno";

const PASSOS = [
  "Você cadastra o aluno e escolhe os cursos.",
  "Menor de 12 anos: o responsável recebe o link e dá o aceite.",
  "O aluno entra pelo código enviado ao e-mail ou pela conta Google.",
];

async function Formulario() {
  await exigirProfessor();

  const supabase = await criarClienteServidor();
  const { data: cursos } = await supabase
    .from("cursos")
    .select("id, titulo, publicado")
    .order("titulo");
  return <FormularioAluno cursos={cursos ?? []} />;
}

export default function ConvidarAluno() {
  return (
    <TelaDoProfessor atual="alunos">
      <main className={`${CONTEINER} flex flex-1 flex-col gap-6 py-8`}>
        <div className="flex items-center gap-4">
          <Link
            href="/professor/alunos"
            aria-label="Voltar para Alunos"
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-linha bg-superficie text-texto hover:border-borda-campo"
          >
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
              <path d="M19 12H5 M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="font-titulo text-4xl break-words text-texto md:text-5xl">
            Convidar aluno
          </h1>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section
            aria-label="Dados do convite"
            className="rounded-3xl border border-linha bg-superficie p-6"
          >
            <Suspense fallback={<p>Carregando…</p>}>
              <Formulario />
            </Suspense>
          </section>

          <aside
            aria-labelledby="como-funciona"
            className="space-y-5 rounded-3xl bg-bordo p-6 text-superficie"
          >
            <h2
              id="como-funciona"
              className="font-titulo text-2xl text-amarelo"
            >
              Como funciona
            </h2>
            <ol className="space-y-4">
              {PASSOS.map((passo, i) => (
                <li key={passo} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amarelo text-sm font-bold text-texto-sobre-amarelo"
                  >
                    {i + 1}
                  </span>
                  <span>{passo}</span>
                </li>
              ))}
            </ol>
            <p className="text-sm">
              Guardamos só nome, e-mail, data de nascimento e progresso.
            </p>
          </aside>
        </div>
      </main>
    </TelaDoProfessor>
  );
}
