import Link from "next/link";
import { Suspense } from "react";
import { AbasDoAluno } from "@/components/abas-do-aluno";
import { classesDoBotao } from "@/components/botao";
import { CabecalhoDoAluno } from "@/components/cabecalho-do-aluno";
import { exigirAlunoOuProfessor } from "@/lib/auth";
import { iniciais } from "@/lib/nomes";

const link =
  "inline-flex min-h-12 items-center text-base text-texto-secundario underline";

async function PerfilDoAluno() {
  const sessao = await exigirAlunoOuProfessor();

  return (
    <>
      <CabecalhoDoAluno nome={sessao.nome} atual="perfil" />

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6 md:py-10">
        <h1 className="font-titulo text-4xl">Perfil</h1>

        <section className="flex items-center gap-4 rounded-3xl border border-linha bg-superficie p-5">
          <span
            aria-hidden="true"
            className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-bordo text-lg font-bold text-superficie"
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

        <form action="/auth/sair" method="post">
          <button type="submit" className={classesDoBotao("secundario")}>
            Sair
          </button>
        </form>

        <ul>
          <li>
            <Link href="/privacidade" className={link}>
              Política de privacidade
            </Link>
          </li>
          <li>
            <Link href="/termos" className={link}>
              Termos de uso
            </Link>
          </li>
        </ul>
      </main>
    </>
  );
}

// Dados da conta e saída, para o celular, onde o cabeçalho não traz o Sair.
export default function Perfil() {
  return (
    <div data-tela-cheia className="flex flex-1 flex-col">
      <Suspense fallback={<p className="p-8">Carregando…</p>}>
        <PerfilDoAluno />
      </Suspense>
      <AbasDoAluno atual="perfil" />
    </div>
  );
}
