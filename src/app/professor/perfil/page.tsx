import type { Metadata } from "next";
import { Suspense } from "react";
import { CartaoDoPerfil } from "@/components/cartao-do-perfil";
import { CONTEINER } from "@/components/conteiner";
import { TelaDoProfessor } from "@/components/tela-do-professor";
import { exigirProfessor } from "@/lib/auth";
import { tituloDaPagina } from "@/lib/site";
import { salvarNomeDoProfessor } from "./acoes";

export const metadata: Metadata = { title: tituloDaPagina("Meu perfil") };

async function DadosDoProfessor() {
  const sessao = await exigirProfessor();
  return (
    <CartaoDoPerfil
      sessao={sessao}
      cores="bg-amarelo text-texto-sobre-amarelo"
      acaoDoNome={salvarNomeDoProfessor}
    />
  );
}

// Meu perfil do professor: só o card do perfil (foto, nome editável e
// e-mail), na mesma coluna do card do aluno. Chega-se aqui pelo avatar do
// cabeçalho, cujo menu traz o tema e o Sair.
export default function PerfilDoProfessor() {
  return (
    <TelaDoProfessor atual="perfil">
      <main
        className={`${CONTEINER} flex max-w-6xl flex-1 flex-col gap-4 py-6 md:gap-6 md:py-8`}
      >
        <h1 className="font-titulo text-4xl text-texto">Meu perfil</h1>

        <div className="w-full md:w-[18rem]">
          <Suspense fallback={<p>Carregando…</p>}>
            <DadosDoProfessor />
          </Suspense>
        </div>
      </main>
    </TelaDoProfessor>
  );
}
