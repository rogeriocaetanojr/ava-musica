import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { classesDoBotao } from "@/components/botao";
import { BotaoSair } from "@/components/botao-sair";
import { BocaDoViolao, Cordas } from "@/components/cordas";
import { LogoDoAva } from "@/components/logo-do-ava";
import { destinoDaSessao, obterSessao } from "@/lib/auth";
import { tituloDaPagina } from "@/lib/site";
import { MENSAGEM_BLOQUEADO } from "../login/mensagens";

export const metadata: Metadata = { title: tituloDaPagina("Acesso pausado") };

async function Conteudo() {
  const sessao = await obterSessao();
  // Sem sessão, chega aqui quem teve o código ou o Google barrado por bloqueio;
  // a tela mostra só o texto genérico.
  if (sessao && (sessao.papel !== "aluno" || !sessao.bloqueado))
    redirect(destinoDaSessao(sessao));

  return (
    <>
      <h1 className="font-titulo text-4xl break-words text-texto">
        {sessao?.nome ? `Olá, ${sessao.nome}` : "Olá"}
      </h1>
      <Aviso role="alert">{MENSAGEM_BLOQUEADO}</Aviso>
      {sessao ? (
        <BotaoSair />
      ) : (
        <Link href="/login" className={classesDoBotao("secundario")}>
          Voltar para a entrada
        </Link>
      )}
    </>
  );
}

export default function Bloqueado() {
  return (
    <main
      data-tela-cheia
      className="flex flex-1 flex-col md:grid md:min-h-screen md:grid-cols-[13fr_11fr]"
    >
      <section className="relative flex h-56 shrink-0 flex-col justify-end overflow-hidden bg-bordo px-6 py-6 text-sobre-bordo md:h-auto md:justify-start md:px-15 md:py-12">
        <Cordas className="absolute inset-y-0 right-10 flex w-28 md:hidden" />
        <BocaDoViolao className="absolute top-10 right-5 size-30 md:hidden" />
        <Cordas className="absolute inset-y-0 left-[78%] hidden w-28 -translate-x-1/2 md:flex lg:left-[70%]" />
        <BocaDoViolao className="absolute top-1/2 left-[78%] hidden size-40 -translate-x-1/2 -translate-y-1/2 md:block lg:left-[70%] lg:size-56" />

        <div className="relative flex items-center gap-3">
          <LogoDoAva className="[--altura:80px] md:[--altura:120px]" />
        </div>

        <div className="relative my-auto hidden max-w-md space-y-6 py-12 md:block">
          <p className="font-titulo text-5xl leading-[1.1] tracking-tight lg:text-6xl">
            Seu acesso está pausado.
            <span className="block text-amarelo">Fale com o professor.</span>
          </p>
        </div>

        <p className="relative hidden text-sm md:block">Aulas de música</p>
      </section>

      <section className="flex flex-1 flex-col px-6 pt-8 pb-6 md:items-center md:justify-center md:px-16 md:py-10">
        <div className="flex w-full flex-1 flex-col gap-6 md:max-w-100 md:flex-none">
          <Suspense>
            <Conteudo />
          </Suspense>
          <footer className="mt-auto pt-6 md:mt-0 md:pt-0">
            <Link
              href="/privacidade"
              className="inline-flex min-h-12 items-center text-sm font-bold text-destaque underline"
            >
              Política de privacidade
            </Link>
          </footer>
        </div>
      </section>
    </main>
  );
}
