"use client";

import { useLayoutEffect } from "react";

type Tema = "claro" | "escuro";

const COOKIE = "tema";

// Lido também pelo script do layout raiz, antes da primeira pintura. Sem
// cookie, vale o tema do sistema.
export const SCRIPT_DO_TEMA = `(function(){try{var m=document.cookie.match(/(?:^|; )${COOKIE}=(claro|escuro)(?:;|$)/);if(m)document.documentElement.setAttribute("data-tema",m[1])}catch(e){}})()`;

function temaDoCookie(): Tema | null {
  const m = document.cookie.match(/(?:^|; )tema=(claro|escuro)(?:;|$)/);
  return m ? (m[1] as Tema) : null;
}

function temaAtual(): Tema {
  const escolhido = document.documentElement.getAttribute("data-tema");
  if (escolhido === "claro" || escolhido === "escuro") return escolhido;
  return matchMedia("(prefers-color-scheme: dark)").matches
    ? "escuro"
    : "claro";
}

// Reaplica o tema quando o React recria o <html> (no modo de desenvolvimento).
export function ReaplicarTema() {
  useLayoutEffect(() => {
    const tema = temaDoCookie();
    if (tema) document.documentElement.setAttribute("data-tema", tema);
  }, []);
  return null;
}

const icone = {
  "aria-hidden": true,
  viewBox: "0 0 24 24",
  className: "size-5",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

// Troca entre claro e escuro e guarda a escolha em cookie. A lua aparece no
// tema claro e o sol no escuro; quem escolhe qual mostrar é o CSS, para o
// ícone já vir certo na primeira pintura.
export function BotaoDoTema() {
  function trocar() {
    const novo: Tema = temaAtual() === "escuro" ? "claro" : "escuro";
    document.documentElement.setAttribute("data-tema", novo);
    document.cookie = `${COOKIE}=${novo}; path=/; max-age=31536000; SameSite=Lax`;
  }

  return (
    <button
      type="button"
      onClick={trocar}
      className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-linha bg-superficie text-texto hover:border-borda-campo"
    >
      <span className="so-no-claro contents">
        <svg {...icone}>
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        </svg>
        <span className="sr-only">Usar tema escuro</span>
      </span>
      <span className="so-no-escuro contents">
        <svg {...icone}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </svg>
        <span className="sr-only">Usar tema claro</span>
      </span>
    </button>
  );
}
