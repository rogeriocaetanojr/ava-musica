import { Suspense } from "react";
import { BotaoSair } from "@/components/botao-sair";
import { exigirProfessor } from "@/lib/auth";

async function Painel() {
  const sessao = await exigirProfessor();

  return (
    <>
      <h1 className="text-2xl font-bold">Olá, {sessao.nome}</h1>
      <p>Painel do professor.</p>
      <BotaoSair />
    </>
  );
}

export default function PainelProfessor() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-8">
      <Suspense>
        <Painel />
      </Suspense>
    </main>
  );
}
