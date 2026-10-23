import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { destinoDoPapel, obterSessao } from "@/lib/auth";
import { tituloDaPagina } from "@/lib/site";
import { FormularioLogin } from "./formulario-login";
import {
  MENSAGEM_BLOQUEADO,
  MENSAGEM_MUITAS_TENTATIVAS,
  MENSAGEM_NAO_CONVIDADO,
  MENSAGEM_PEDIDO_BARRADO,
  MENSAGEM_SESSAO_EXPIRADA,
} from "./mensagens";

export const metadata: Metadata = { title: tituloDaPagina("Entrar") };

const MENSAGENS_DE_ERRO: Record<string, string> = {
  "nao-convidado": MENSAGEM_NAO_CONVIDADO,
  "muitas-tentativas": MENSAGEM_MUITAS_TENTATIVAS,
  bloqueado: MENSAGEM_BLOQUEADO,
  "pedido-barrado": MENSAGEM_PEDIDO_BARRADO,
  "sessao-expirada": MENSAGEM_SESSAO_EXPIRADA,
  google:
    "Não foi possível entrar com o Google. Tente de novo ou entre pelo e-mail.",
};

type Parametros = Promise<{ erro?: string }>;

// Quem já está logado vai direto para a sua área.
async function RedirecionarLogado() {
  const sessao = await obterSessao();
  if (sessao) redirect(destinoDoPapel(sessao.papel));
  return null;
}

async function AvisoDeErro({ searchParams }: { searchParams: Parametros }) {
  const { erro } = await searchParams;
  const mensagem = erro ? MENSAGENS_DE_ERRO[erro] : undefined;
  if (!mensagem) return null;

  return (
    <p role="alert" className="rounded-md bg-red-100 p-3 text-red-800">
      {mensagem}
    </p>
  );
}

export default function PaginaLogin({
  searchParams,
}: {
  searchParams: Parametros;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-center text-2xl font-bold">Entrar</h1>
        <Suspense>
          <RedirecionarLogado />
          <AvisoDeErro searchParams={searchParams} />
        </Suspense>
        <FormularioLogin />
      </div>
    </main>
  );
}
