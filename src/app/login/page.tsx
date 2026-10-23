import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoDoAva } from "@/components/logo-do-ava";
import { Aviso } from "@/components/aviso";
import { BocaDoViolao, Cordas } from "@/components/cordas";
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

export const metadata: Metadata = { title: tituloDaPagina() };

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
      className="flex flex-1 flex-col md:grid md:min-h-screen md:grid-cols-[13fr_11fr]"
    >
      <section className="relative flex h-56 shrink-0 flex-col justify-end overflow-hidden bg-bordo px-6 py-6 text-superficie md:h-auto md:justify-start md:px-15 md:py-12">
        {/* No celular, os enfeites ficam no canto direito do topo. */}
        <Cordas className="absolute inset-y-0 right-10 flex w-28 md:hidden" />
        <BocaDoViolao className="absolute top-10 right-5 size-30 md:hidden" />
        <Cordas className="absolute inset-y-0 left-[78%] hidden w-28 -translate-x-1/2 md:flex lg:left-[70%]" />
        <BocaDoViolao className="absolute top-1/2 left-[78%] hidden size-40 -translate-x-1/2 -translate-y-1/2 md:block lg:left-[70%] lg:size-56" />

        <div className="relative flex items-center gap-3">
          <LogoDoAva className="[--altura:80px] md:[--altura:120px]" />
        </div>

        <div className="relative my-auto hidden max-w-md space-y-6 py-12 md:block">
          <p className="font-titulo text-5xl leading-[1.1] tracking-tight lg:text-6xl">
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

        <p className="relative hidden text-sm md:block">Aulas de música</p>
      </section>

      <section className="flex flex-1 flex-col px-6 pt-8 pb-6 md:items-center md:justify-center md:px-16 md:py-10">
        <div className="flex w-full flex-1 flex-col gap-6 md:max-w-100 md:flex-none">
          <div className="space-y-4">
            <h1 className="font-titulo text-4xl text-texto">Entrar</h1>
            <p className="hidden leading-relaxed text-texto-secundario md:block">
              Use sua conta Google ou receba um código de acesso no e-mail. Sem
              senha para lembrar.
            </p>
          </div>
          <Suspense>
            <RedirecionarLogado />
            <AvisoDeErro searchParams={searchParams} />
          </Suspense>
          <FormularioLogin />
          <footer className="mt-auto space-y-1 pt-6 md:mt-0 md:pt-0">
            <p className="text-sm leading-relaxed text-texto-secundario md:hidden">
              Acesso só por convite. Para menores de 12 anos, o responsável
              aceita primeiro.
            </p>
            <Link
              href="/privacidade"
              className="inline-flex min-h-12 items-center text-sm font-bold text-bordo underline"
            >
              Política de privacidade
            </Link>
          </footer>
        </div>
      </section>
    </main>
  );
}
