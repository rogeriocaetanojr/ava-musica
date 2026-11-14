import { CONTEINER } from "@/components/conteiner";
import { Suspense } from "react";
import { Rodape } from "@/components/rodape";
import { AbasDoAluno } from "@/components/abas-do-aluno";
import { classesDoBotao } from "@/components/botao";
import { CabecalhoDoAluno } from "@/components/cabecalho-do-aluno";
import { exigirAlunoOuProfessor } from "@/lib/auth";
import { BotaoDoTema } from "@/components/seletor-de-tema";
import { TrocarSenha } from "@/components/trocar-senha";
import { iniciais } from "@/lib/nomes";

async function PerfilDoAluno() {
  const sessao = await exigirAlunoOuProfessor();

  return (
    <>
      <CabecalhoDoAluno nome={sessao.nome} atual="perfil" />

      <main
        className={`${CONTEINER} flex max-w-xl flex-1 flex-col gap-6 py-6 md:py-10`}
      >
        <h1 className="font-titulo text-4xl">Perfil</h1>

        <section className="flex items-center gap-4 rounded-3xl border border-linha bg-superficie p-5">
          <span
            aria-hidden="true"
            className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-bordo text-lg font-bold text-sobre-bordo"
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

        <BotaoDoTema comTexto />

        <form action="/auth/sair" method="post" className="md:hidden">
          <button type="submit" className={classesDoBotao("secundario")}>
            Sair
          </button>
        </form>
      </main>
    </>
  );
}

// Dados da conta. O botão Sair aparece só no celular, onde o cabeçalho não o traz.
export default function Perfil() {
  return (
    <div data-tela-cheia className="flex min-h-dvh flex-1 flex-col">
      <div className="flex flex-1 flex-col">
        <Suspense fallback={<p className="p-8">Carregando…</p>}>
          <PerfilDoAluno />
        </Suspense>
      </div>
      <Rodape largura="max-w-6xl" />
      <AbasDoAluno atual="perfil" />
    </div>
  );
}
