// Tema claro e escuro: usado pelo seletor (no navegador), pelo layout raiz e
// pelo proxy, que libera o script do tema na CSP pelo hash dele.

export type Tema = "claro" | "escuro";

export const COOKIE_DO_TEMA = "tema";

// Cor da barra do navegador e do sistema: a mesma do fundo de cada tema.
export const COR_DA_BARRA: Record<Tema, string> = {
  claro: "#fbf5ea",
  escuro: "#170b0e",
};

// Lido pelo script do layout raiz, antes da primeira pintura. Sem cookie, vale
// o tema do sistema. Com tema escolhido, a barra do navegador segue a escolha
// em vez do sistema. O texto é fixo: a CSP libera este script pelo hash, e
// qualquer mudança aqui muda o hash junto (ver src/proxy.ts).
export const SCRIPT_DO_TEMA = `(function(){try{var m=document.cookie.match(/(?:^|; )${COOKIE_DO_TEMA}=(claro|escuro)(?:;|$)/);if(!m)return;var t=m[1],c=${JSON.stringify(COR_DA_BARRA)}[t];document.documentElement.setAttribute("data-tema",t);var b=function(){document.querySelectorAll('meta[name="theme-color"]').forEach(function(e){e.setAttribute("content",c)})};b();document.addEventListener("DOMContentLoaded",b)}catch(e){}})()`;
