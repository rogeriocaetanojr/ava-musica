import Link from "next/link";
import { LogoDoAva } from "@/components/logo-do-ava";

// Cabeçalho e rodapé somem nas telas de página inteira, marcadas com
// data-tela-cheia (ver globals.css).

export function Cabecalho() {
  return (
    <header
      data-moldura
      className="border-b-4 border-amarelo bg-bordo text-superficie"
    >
      <div className="mx-auto flex w-full max-w-4xl items-center px-4 py-3">
        <Link href="/" className="flex min-h-12 items-center gap-3 font-bold">
          <LogoDoAva
            semSubtitulo
            className="[--altura:46px] md:[--altura:56px]"
          />
        </Link>
      </div>
    </header>
  );
}

export function Rodape() {
  return (
    <footer
      data-moldura
      className="border-t-4 border-amarelo bg-bordo text-sm text-superficie"
    >
      <nav
        aria-label="Rodapé"
        className="mx-auto flex w-full max-w-4xl flex-wrap gap-x-6 gap-y-2 px-4 py-4"
      >
        <Link href="/privacidade" className="underline">
          Política de privacidade
        </Link>
        <Link href="/termos" className="underline">
          Termos de uso
        </Link>
      </nav>
    </footer>
  );
}
