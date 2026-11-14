import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { classesDoBotao } from "@/components/botao";
import { CONTEINER } from "@/components/conteiner";
import { BotaoDoTema } from "@/components/seletor-de-tema";
import { TelaDoProfessor } from "@/components/tela-do-professor";
import { TrocarSenha } from "@/components/trocar-senha";
import { exigirProfessor } from "@/lib/auth";
import { iniciais } from "@/lib/nomes";
import { tituloDaPagina } from "@/lib/site";

export const metadata: Metadata = { title: tituloDaPagina("Perfil") };

const link =
  "inline-flex min-h-12 items-center text-base text-texto-secundario underline";

async function DadosDoProfessor() {
  const sessao = await exigirProfessor();

  return (
    <>
      <section className="flex items-center gap-4 rounded-3xl border border-linha bg-superficie p-5">
        <span
          aria-hidden="true"
          className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-amarelo text-lg font-bold text-texto-sobre-amarelo"
        >
          {iniciais(sessao.nome)}
        </span>
        <div className="min-w-0">
          <p className="text-lg font-bold break-words">{sessao.nome}</p>
          <p className="text-base break-words text-texto-secundario">
            {sessao.email}
          </p>
        </div>
      </section>

      <TrocarSenha email={sessao.email} />
    </>
  );
}

// Dados da conta do professor, troca de senha, tema e saída. Chega-se aqui
// pelo avatar do cabeçalho.
export default function PerfilDoProfessor() {
  return (
    <TelaDoProfessor atual="perfil">
      <main
        className={`${CONTEINER} flex max-w-xl flex-1 flex-col gap-6 py-6 md:py-10`}
      >
        <h1 className="font-titulo text-4xl text-texto">Perfil</h1>

        <Suspense fallback={<p>Carregando…</p>}>
          <DadosDoProfessor />
        </Suspense>

        <BotaoDoTema comTexto />

        <form action="/auth/sair" method="post">
          <button type="submit" className={classesDoBotao("secundario")}>
            Sair
          </button>
        </form>

        <ul>
          <li>
            <Link href="/cursos" className={link}>
              Ver como aluno
            </Link>
          </li>
        </ul>
      </main>
    </TelaDoProfessor>
  );
}
