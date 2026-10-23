import { createBrowserClient } from "@supabase/ssr";
import { semValidade } from "@/lib/sessao";

type OpcoesDeCookie = {
  path?: string;
  maxAge?: number;
  sameSite?: boolean | "lax" | "strict" | "none";
  secure?: boolean;
};

function lerCookies(): { name: string; value: string }[] {
  return document.cookie
    .split("; ")
    .filter(Boolean)
    .map((par) => {
      const igual = par.indexOf("=");
      return {
        name: par.slice(0, igual),
        value: decodeURIComponent(par.slice(igual + 1)),
      };
    });
}

// Grava sem expires nem max-age (cookie de sessão), salvo na remoção.
function gravarCookie(nome: string, valor: string, opcoes: OpcoesDeCookie) {
  const { path, maxAge, sameSite, secure } = semValidade(opcoes);
  const partes = [
    `${nome}=${encodeURIComponent(valor)}`,
    `path=${path ?? "/"}`,
  ];
  if (maxAge === 0) partes.push("max-age=0");
  if (typeof sameSite === "string") partes.push(`samesite=${sameSite}`);
  if (secure || window.location.protocol === "https:") partes.push("secure");
  document.cookie = partes.join("; ");
}

// Cliente para componentes que rodam no navegador (chave pública), com a
// sessão em cookies que somem ao fechar o navegador.
export function criarClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: lerCookies,
        setAll(cookiesParaGravar) {
          cookiesParaGravar.forEach(({ name, value, options }) =>
            gravarCookie(name, value, options),
          );
        },
      },
    },
  );
}
