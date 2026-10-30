import type { ReactNode } from "react";
import Link from "next/link";
import { CONTEINER } from "@/components/conteiner";
import { Cordas } from "@/components/cordas";
import { LogoDoAva } from "@/components/logo-do-ava";
import { NOME_DO_AVA, VERSAO_DOS_TERMOS } from "@/lib/site";

// Moldura comum da política de privacidade e dos termos de uso: cabeçalho
// próprio (a página é aberta também sem login), faixa com o título, sumário
// na lateral e o texto num cartão de leitura.

export type SecaoDoTexto = { id: string; titulo: string; conteudo: ReactNode };

const DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

// A versão aceita pelo aluno é a mesma mostrada aqui. Se for uma data
// (2026-10-20), aparece por extenso.
export function textoDaVersao(versao: string): string {
  const data = DATA_ISO.exec(versao);
  if (!data) return `Versão ${versao}`;
  const [, ano, mes, dia] = data;
  const extenso = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(+ano, +mes - 1, +dia)));
  return `Versão de ${extenso}`;
}

// Os textos ainda passam por revisão jurídica antes de abrir para os alunos.
function AvisoRascunho() {
  return (
    <p className="rounded-xl bg-bloco p-4 text-sm text-texto-sobre-bloco">
      Rascunho em revisão jurídica. O texto pode mudar antes da abertura para os
      alunos.
    </p>
  );
}

const link =
  "inline-flex min-h-12 items-center rounded-xl px-4 text-base font-bold";

export function TextoLegal({
  titulo,
  introducao,
  secoes,
  fecho,
}: {
  titulo: string;
  introducao: ReactNode;
  secoes: SecaoDoTexto[];
  fecho: ReactNode;
}) {
  const sumario = (
    <ul>
      {secoes.map(({ id, titulo }) => (
        <li key={id}>
          <a
            href={`#${id}`}
            className="flex min-h-12 items-center rounded-xl px-4 text-texto hover:bg-bloco hover:text-texto-sobre-bloco"
          >
            {titulo}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <div data-tela-cheia className="flex min-h-screen flex-1 flex-col">
      <header className="border-b border-linha bg-superficie">
        <div
          className={`${CONTEINER} flex items-center justify-between gap-4 py-3`}
        >
          <Link href="/" className="flex min-h-12 items-center text-texto">
            <LogoDoAva
              semSubtitulo
              className="[--altura:46px] lg:[--altura:60px]"
            />
          </Link>
          <Link
            href="/login"
            className={`${link} text-texto-secundario hover:text-texto`}
          >
            Entrar
          </Link>
        </div>
      </header>

      <div className="relative overflow-hidden bg-bordo text-sobre-bordo">
        <Cordas className="absolute inset-y-0 right-4 w-16 md:right-24 md:w-28" />
        <div className={`${CONTEINER} relative py-5 md:py-10`}>
          <p className="text-sm font-bold text-amarelo">{NOME_DO_AVA}</p>
          <h1 className="mt-1 pr-20 font-titulo text-2xl tracking-tight md:pr-0 md:text-4xl">
            {titulo}
          </h1>
        </div>
      </div>

      <main
        className={`${CONTEINER} grid flex-1 items-start gap-6 py-6 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-10 md:py-10`}
      >
        {/* No celular o sumário fica recolhido acima do texto; a partir de md,
            na lateral. Só um dos dois aparece por vez. */}
        <details className="group rounded-2xl border border-linha bg-superficie md:hidden">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between rounded-2xl px-5 font-bold text-texto [&::-webkit-details-marker]:hidden">
            Nesta página
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-5 transition-transform group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </summary>
          <nav aria-label="Nesta página" className="px-1 pb-3">
            {sumario}
          </nav>
        </details>

        <nav
          aria-labelledby="titulo-do-sumario"
          className="hidden rounded-2xl border border-linha bg-superficie p-4 md:sticky md:top-6 md:block"
        >
          <h2
            id="titulo-do-sumario"
            className="px-4 pb-2 text-sm font-bold text-texto-secundario"
          >
            Nesta página
          </h2>
          {sumario}
        </nav>

        <article className="flex max-w-[70ch] flex-col gap-4 rounded-2xl border border-linha bg-superficie p-5 text-[17px] leading-relaxed md:p-10 md:text-base [&_a]:font-bold [&_a]:text-destaque [&_a]:underline [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:marker:text-destaque">
          <p className="text-sm text-texto-secundario">
            {textoDaVersao(VERSAO_DOS_TERMOS)}
          </p>
          <AvisoRascunho />
          {introducao}
          {secoes.map(({ id, titulo, conteudo }) => (
            <section
              key={id}
              aria-labelledby={id}
              className="flex flex-col gap-4 pt-2"
            >
              <h2
                id={id}
                className="scroll-mt-4 font-titulo md:scroll-mt-6 text-2xl tracking-tight"
              >
                {titulo}
              </h2>
              {conteudo}
            </section>
          ))}
          {fecho}
        </article>
      </main>

      <footer className="border-t-4 border-amarelo bg-bordo text-sm text-sobre-bordo">
        <nav
          aria-label="Rodapé"
          className={`${CONTEINER} flex flex-wrap gap-x-2 py-2`}
        >
          <Link
            href="/privacidade"
            className="flex min-h-12 items-center px-2 underline"
          >
            Política de privacidade
          </Link>
          <Link
            href="/termos"
            className="flex min-h-12 items-center px-2 underline"
          >
            Termos de uso
          </Link>
        </nav>
      </footer>
    </div>
  );
}
