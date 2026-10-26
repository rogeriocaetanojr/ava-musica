"use client";

import { type ReactNode, useState } from "react";

// Bloco recolhível só no celular: o botão do topo abre e fecha o conteúdo.
// No computador o botão some e o conteúdo fica sempre à vista. Não usa
// <details> porque, fechado, ele esconderia o conteúdo também no computador.
export function Recolhivel({
  abertoNoInicio,
  cabecalho,
  classeDoConteudo = "",
  children,
}: {
  abertoNoInicio: boolean;
  cabecalho: ReactNode;
  classeDoConteudo?: string;
  children: ReactNode;
}) {
  const [aberto, setAberto] = useState(abertoNoInicio);

  return (
    <>
      <button
        type="button"
        aria-expanded={aberto}
        onClick={() => setAberto(!aberto)}
        className="flex min-h-12 w-full items-center gap-3 rounded-xl text-left md:hidden"
      >
        <span className="min-w-0 flex-1">{cabecalho}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`size-5 shrink-0 text-texto transition-transform ${aberto ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div className={`${classeDoConteudo} ${aberto ? "" : "max-md:hidden"}`}>
        {children}
      </div>
    </>
  );
}
