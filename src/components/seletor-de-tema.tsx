"use client";

import { useLayoutEffect } from "react";

type Tema = "claro" | "escuro";

const COOKIE = "tema";

// Cor da barra do navegador e do sistema: a mesma do fundo de cada tema.
export const COR_DA_BARRA: Record<Tema, string> = {
  claro: "#fbf5ea",
  escuro: "#170b0e",
};

// Lido também pelo script do layout raiz, antes da primeira pintura. Sem
// cookie, vale o tema do sistema. Com tema escolhido, a barra do navegador
// segue a escolha em vez do sistema.
export const SCRIPT_DO_TEMA = `(function(){try{var m=document.cookie.match(/(?:^|; )${COOKIE}=(claro|escuro)(?:;|$)/);if(!m)return;var t=m[1],c=${JSON.stringify(COR_DA_BARRA)}[t];document.documentElement.setAttribute("data-tema",t);var b=function(){document.querySelectorAll('meta[name="theme-color"]').forEach(function(e){e.setAttribute("content",c)})};b();document.addEventListener("DOMContentLoaded",b)}catch(e){}})()`;

function aplicar(tema: Tema) {
  document.documentElement.setAttribute("data-tema", tema);
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute("content", COR_DA_BARRA[tema]));
}

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
    if (tema) aplicar(tema);
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
// ícone já vir certo na primeira pintura. Com texto, vira uma linha larga,
// para o perfil no celular.
export function BotaoDoTema({ comTexto = false }: { comTexto?: boolean }) {
  function trocar() {
    const novo: Tema = temaAtual() === "escuro" ? "claro" : "escuro";
    aplicar(novo);
    document.cookie = `${COOKIE}=${novo}; path=/; max-age=31536000; SameSite=Lax`;
  }

  return (
    <button
      type="button"
      onClick={trocar}
      className={
        comTexto
          ? "flex min-h-14 w-full items-center gap-4 rounded-3xl border border-linha bg-superficie px-5 py-3 text-left text-base font-bold text-texto hover:border-borda-campo"
          : "inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-linha bg-superficie text-texto hover:border-borda-campo"
      }
    >
      <span className="so-no-claro contents">
        <svg {...icone}>
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        </svg>
        <span className={comTexto ? undefined : "sr-only"}>
          Usar tema escuro
        </span>
      </span>
      <span className="so-no-escuro contents">
        <svg {...icone}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </svg>
        <span className={comTexto ? undefined : "sr-only"}>
          Usar tema claro
        </span>
      </span>
    </button>
  );
}
