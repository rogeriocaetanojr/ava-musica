import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { BocaDoViolao, Cordas } from "@/components/cordas";
import { destinoDoPapel, obterSessao } from "@/lib/auth";
import { LOGO_DO_AVA, NOME_DO_AVA, tituloDaPagina } from "@/lib/site";
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
    <Aviso role="alert">
      <p>{mensagem}</p>
    </Aviso>
  );
}

export default function PaginaLogin({
  searchParams,
}: {
  searchParams: Parametros;
}) {
  return (
    <main
      data-tela-cheia
      className="grid flex-1 lg:min-h-screen lg:grid-cols-[13fr_11fr]"
    >
      <section className="relative flex flex-col overflow-hidden bg-bordo px-6 py-6 text-superficie lg:px-15 lg:py-12">
        <Cordas className="absolute inset-y-0 left-[70%] hidden w-28 -translate-x-1/2 lg:flex" />
        <BocaDoViolao className="absolute top-1/2 left-[70%] hidden size-56 -translate-x-1/2 -translate-y-1/2 lg:block" />

        <div className="relative flex items-center gap-3">
          <Image src={LOGO_DO_AVA} alt="" width={44} height={44} priority />
          <span className="font-titulo text-2xl">{NOME_DO_AVA}</span>
        </div>

        <div className="relative my-auto hidden max-w-md space-y-6 py-12 lg:block">
          <p className="font-titulo text-6xl leading-[1.1] tracking-tight">
            Afine e entre.
            <span className="block text-amarelo">
              A aula de hoje te espera.
            </span>
          </p>
          <p className="text-lg leading-relaxed">
            Vídeos, cifras, playbacks e provas das suas aulas de música, num só
            lugar.
          </p>
        </div>

        <p className="relative hidden text-sm lg:block">Aulas de música</p>
      </section>

      <section className="flex items-center justify-center px-6 py-10 lg:px-16">
        <div className="w-full max-w-100 space-y-6">
          <div className="space-y-4">
            <h1 className="font-titulo text-4xl text-texto">Entrar</h1>
            <p className="leading-relaxed text-texto-secundario">
              Use sua conta Google ou receba um código de acesso no e-mail. Sem
              senha para lembrar.
            </p>
          </div>
          <Suspense>
            <RedirecionarLogado />
            <AvisoDeErro searchParams={searchParams} />
          </Suspense>
          <FormularioLogin />
          <Link
            href="/privacidade"
            className="inline-flex min-h-12 items-center text-sm font-bold text-bordo underline"
          >
            Política de privacidade
          </Link>
        </div>
      </section>
    </main>
  );
}
