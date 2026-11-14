import type { ReactNode } from "react";
import { BocaDoViolao, Cordas } from "@/components/cordas";
import { Rodape } from "@/components/rodape";
import { LogoDoAva } from "@/components/logo-do-ava";

// Moldura das telas de entrada (login, criar conta e convite): a faixa bordô
// com o logo à esquerda, ou no topo no celular, e o formulário ao lado. As
// medidas cabem sem rolagem em 1280×720 e em 390×844.
export function TelaDeEntrada({
  chamada,
  destaque,
  apoio,
  titulo,
  subtitulo,
  nota,
  rodape,
  children,
}: {
  chamada: string;
  destaque: string;
  // Frase menor abaixo da chamada, só no computador.
  apoio?: string;
  titulo: string;
  // Texto abaixo do título, só no computador.
  subtitulo?: string;
  // Texto curto no pé da tela, só no celular.
  nota?: string;
  // Link extra no pé do formulário (ex.: Criar conta).
  rodape?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main
      data-tela-cheia
      className="flex min-h-dvh flex-1 flex-col md:grid md:grid-cols-[13fr_11fr]"
    >
      <section className="relative flex h-44 shrink-0 flex-col justify-end overflow-hidden bg-bordo px-6 pb-5 text-sobre-bordo md:h-auto md:justify-start md:px-15 md:py-10">
        {/* No celular, os enfeites ficam no canto direito do topo. */}
        <Cordas className="absolute inset-y-0 right-12 flex w-24 md:hidden" />
        <BocaDoViolao className="absolute top-6 right-6 size-28 md:hidden" />
        <Cordas className="absolute inset-y-0 left-[76%] hidden w-28 -translate-x-1/2 md:flex" />
        <BocaDoViolao className="absolute top-1/2 left-[76%] hidden size-44 -translate-x-1/2 -translate-y-1/2 md:block lg:size-52 2xl:size-56" />

        <div className="relative flex items-center">
          <LogoDoAva className="[--altura:64px] md:[--altura:88px]" />
        </div>

        <div className="relative my-auto hidden max-w-[22rem] space-y-5 2xl:max-w-[26rem] md:block">
          <p className="font-titulo text-4xl leading-[1.05] tracking-tight lg:text-[3.25rem] 2xl:text-6xl">
            {chamada}
            <span className="block text-amarelo">{destaque}</span>
          </p>
          {apoio && <p className="text-lg leading-relaxed">{apoio}</p>}
        </div>

        <p className="relative hidden text-sm md:block">Aulas de música</p>
      </section>

      <section className="flex flex-1 flex-col px-6 pt-6 pb-4 md:items-center md:justify-center md:px-16 md:py-8">
        <div className="flex w-full flex-1 flex-col gap-5 md:max-w-88 md:flex-none">
          <div className="space-y-3">
            <h1 className="font-titulo text-4xl leading-tight text-texto">
              {titulo}
            </h1>
            {subtitulo && (
              <p className="hidden leading-normal text-texto-secundario md:block">
                {subtitulo}
              </p>
            )}
          </div>
          {children}
          <div className="mt-auto space-y-1 md:mt-0">
            {nota && (
              <p className="text-sm leading-normal text-texto-secundario md:hidden">
                {nota}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-x-4">
              {rodape}
            </div>
          </div>
          <Rodape compacto />
        </div>
      </section>
    </main>
  );
}
