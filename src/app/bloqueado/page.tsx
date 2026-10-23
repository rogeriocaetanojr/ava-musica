import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BotaoSair } from "@/components/botao-sair";
import { destinoDaSessao, obterSessao } from "@/lib/auth";
import { tituloDaPagina } from "@/lib/site";
import { MENSAGEM_BLOQUEADO } from "../login/mensagens";

export const metadata: Metadata = { title: tituloDaPagina("Acesso pausado") };

async function Aviso() {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login?erro=bloqueado");
  if (sessao.papel !== "aluno" || !sessao.bloqueado)
    redirect(destinoDaSessao(sessao));

  return (
    <>
      <h1 className="text-2xl font-bold break-words">
        {sessao.nome ? `Olá, ${sessao.nome}` : "Olá"}
      </h1>
      <p role="alert">{MENSAGEM_BLOQUEADO}</p>
      <BotaoSair />
    </>
  );
}

export default function Bloqueado() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-8">
      <Suspense>
        <Aviso />
      </Suspense>
    </main>
  );
}
