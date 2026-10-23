import Image from "next/image";
import Link from "next/link";
import { LOGO_DO_AVA, NOME_DO_AVA } from "@/lib/site";

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
          <Image src={LOGO_DO_AVA} alt="" width={36} height={36} priority />
          <span className="text-lg">{NOME_DO_AVA}</span>
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
