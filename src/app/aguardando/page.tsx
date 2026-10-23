import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BotaoSair } from "@/components/botao-sair";
import { alunoLiberado, destinoDoPapel, obterSessao } from "@/lib/auth";
import { tituloDaPagina } from "@/lib/site";
import { textoDaEspera } from "./textos";

export const metadata: Metadata = {
  title: tituloDaPagina("Aguardando liberação"),
};

async function Aviso() {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");
  if (sessao.papel === "aluno" && sessao.bloqueado) redirect("/bloqueado");
  if (sessao.papel !== "aluno" || (await alunoLiberado()))
    redirect(destinoDoPapel(sessao.papel));
  const texto = textoDaEspera(sessao.pendente);

  return (
    <>
      <h1 className="text-2xl font-bold break-words">{texto.titulo}</h1>
      <p className="break-words">Olá, {sessao.nome}.</p>
      <p>{texto.explicacao}</p>
      <p className="text-sm">{texto.dica}</p>
      <BotaoSair />
    </>
  );
}

export default function Aguardando() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-8">
      <Suspense>
        <Aviso />
      </Suspense>
    </main>
  );
}
