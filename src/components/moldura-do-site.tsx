import Link from "next/link";
import { Rodape } from "@/components/rodape";
import { LogoDoAva } from "@/components/logo-do-ava";

// Cabeçalho e rodapé somem nas telas de página inteira, marcadas com
// data-tela-cheia (ver globals.css).

export function Cabecalho() {
  return (
    <header
      data-moldura
      className="border-b-4 border-amarelo bg-bordo text-sobre-bordo"
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

// Rodapé das páginas que usam a moldura geral; some nas telas de página
// inteira, que trazem o próprio rodapé.
export function RodapeDoSite() {
  return (
    <div data-moldura>
      <Rodape />
    </div>
  );
}
