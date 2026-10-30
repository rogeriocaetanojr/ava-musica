import { BotaoVoltar } from "@/components/botao-voltar";
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

const DADOS = "Guardamos só nome, e-mail, data de nascimento e progresso.";

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
    <TelaDoProfessor atual="alunos" semAbas>
      <main
        className={`${CONTEINER} flex flex-1 flex-col gap-5 py-6 md:gap-6 md:py-8`}
      >
        <div className="flex items-center gap-4">
          <BotaoVoltar
            href="/professor/alunos"
            rotulo="Voltar para Alunos"
            fino
          />
          <div className="min-w-0">
            <p className="font-bold text-destaque md:hidden">Alunos</p>
            <h1 className="font-titulo text-3xl break-words text-texto md:text-5xl">
              Convidar aluno
            </h1>
          </div>
        </div>

        <details className="group rounded-2xl bg-bloco text-texto-sobre-bloco md:hidden">
          <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-2xl px-4 py-3 font-bold [&::-webkit-details-marker]:hidden">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-6 shrink-0 text-destaque"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 11v5 M12 8h.01" />
            </svg>
            <span className="flex-1">Como funciona o convite</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-5 shrink-0 transition-transform group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </summary>
          <div className="space-y-4 px-4 pb-4">
            <ol className="space-y-3">
              {PASSOS.map((passo, i) => (
                <li key={passo} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-bordo text-sm font-bold text-sobre-bordo"
                  >
                    {i + 1}
                  </span>
                  <span>{passo}</span>
                </li>
              ))}
            </ol>
            <p className="text-sm">{DADOS}</p>
          </div>
        </details>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section
            aria-label="Dados do convite"
            className="md:rounded-3xl md:border md:border-linha md:bg-superficie md:p-6"
          >
            <Suspense fallback={<p>Carregando…</p>}>
              <Formulario />
            </Suspense>
          </section>

          <aside
            aria-labelledby="como-funciona"
            className="hidden space-y-5 rounded-3xl border border-borda-cartao bg-bordo p-6 text-sobre-bordo md:block"
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
            <p className="text-sm">{DADOS}</p>
          </aside>
        </div>
      </main>
    </TelaDoProfessor>
  );
}
