import type { ReactNode } from "react";
import { BocaDoViolao, Cordas } from "@/components/cordas";
import { LogoDoAva } from "@/components/logo-do-ava";
import { Rodape } from "@/components/rodape";

// Tela de entrada (login, criar conta, esqueci minha senha e nova senha):
// no computador, a faixa bordô na tela toda, com o logo
// grande à esquerda, o formulário num cartão no centro e o violão com as
// cordas à direita. No celular, só o formulário, com o logo em cima.
export function TelaDeLogin({
  titulo,
  subtitulo,
  nota,
  children,
}: {
  titulo: string;
  // Texto abaixo do título, só no computador.
  subtitulo?: string;
  // Texto curto no pé do formulário, só no celular.
  nota?: string;
  children: ReactNode;
}) {
  return (
    <main
      data-tela-cheia
      className="relative flex min-h-dvh flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[1fr_minmax(0,26rem)_1fr] lg:items-center lg:gap-10 lg:bg-bordo lg:px-10 lg:py-6"
    >
      <div className="flex justify-center px-6 pt-8 pb-2 text-destaque lg:p-0 lg:text-sobre-bordo">
        <LogoDoAva className="[--altura:72px] lg:[--altura:160px] 2xl:[--altura:200px]" />
      </div>

      <section className="flex flex-1 flex-col px-6 pt-4 pb-4 lg:flex-none lg:rounded-3xl lg:bg-superficie lg:px-8 lg:py-6 lg:shadow-xl">
        <div className="flex w-full flex-1 flex-col gap-4 lg:gap-3">
          <div className="space-y-2">
            <h1 className="font-titulo text-4xl leading-tight text-texto lg:text-3xl">
              {titulo}
            </h1>
            {subtitulo && (
              <p className="hidden leading-normal text-texto-secundario lg:block">
                {subtitulo}
              </p>
            )}
          </div>
          {children}
          {nota && (
            <p className="mt-auto text-sm leading-normal text-texto-secundario lg:hidden">
              {nota}
            </p>
          )}
          <Rodape compacto />
        </div>
      </section>

      <div
        aria-hidden="true"
        className="relative hidden h-full min-h-80 items-center justify-center lg:flex"
      >
        <Cordas className="absolute inset-y-[-2rem] left-1/2 w-28 -translate-x-1/2" />
        <BocaDoViolao className="relative size-44 2xl:size-56" />
      </div>
    </main>
  );
}
