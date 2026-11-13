"use client";

import { NOME_CURTO_DO_AVA } from "@/lib/site";
import "./globals.css";

// Erro que derruba até o layout raiz: página mínima, com html e body próprios,
// sem sessão nem componentes que dependam do layout.
export default function ErroGeral({ reset }: { reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-dvh flex-col items-center justify-center bg-fundo px-6 text-texto">
        <main className="w-full max-w-88 space-y-5">
          <p className="text-sm font-bold text-texto-secundario">
            {NOME_CURTO_DO_AVA}
          </p>
          <h1 className="text-4xl font-extrabold">Algo deu errado</h1>
          <p className="leading-normal text-texto-secundario">
            Não foi possível abrir o site agora.
          </p>
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-13 w-full items-center justify-center rounded-xl bg-bordo px-5 py-3 font-bold text-sobre-bordo hover:bg-vinho"
          >
            Tentar de novo
          </button>
          <a
            href="/"
            className="inline-flex min-h-13 w-full items-center justify-center rounded-xl border border-linha bg-superficie px-5 py-3 font-bold text-texto hover:border-borda-campo"
          >
            Voltar ao início
          </a>
        </main>
      </body>
    </html>
  );
}
