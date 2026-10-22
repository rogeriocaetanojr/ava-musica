import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BotaoSair } from "@/components/botao-sair";
import { alunoLiberado, destinoDoPapel, obterSessao } from "@/lib/auth";
import { tituloDaPagina } from "@/lib/site";

export const metadata: Metadata = {
  title: tituloDaPagina("Aguardando o responsável"),
};

async function Aviso() {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");
  if (sessao.papel !== "aluno" || (await alunoLiberado()))
    redirect(destinoDoPapel(sessao.papel));

  return (
    <>
      <h1 className="text-2xl font-bold break-words">Olá, {sessao.nome}</h1>
      <p>
        Seu acesso está aguardando a autorização do seu responsável. Assim que
        ele autorizar, você vai poder ver seus cursos e aulas.
      </p>
      <p className="text-sm">
        Se já faz um tempo, peça ao seu responsável para conferir o e-mail ou
        fale com o professor.
      </p>
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
