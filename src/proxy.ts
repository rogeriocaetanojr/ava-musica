import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ehBloqueado } from "./app/login/mensagens";

const ROTAS_PUBLICAS = [
  "/login",
  "/auth",
  "/aceite",
  "/privacidade",
  "/termos",
  "/robots.txt",
];

function ehPublica(caminho: string): boolean {
  return ROTAS_PUBLICAS.some(
    (rota) => caminho === rota || caminho.startsWith(`${rota}/`),
  );
}

// Renova a sessão a cada requisição e manda para /login quem não está logado.
// A conta bloqueada pelo professor tem a sessão recusada pelo Supabase
// (user_banned): os cookies são apagados e o aluno vê o aviso no login.
export async function proxy(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesParaGravar) {
          cookiesParaGravar.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          resposta = NextResponse.next({ request });
          cookiesParaGravar.forEach(({ name, value, options }) =>
            resposta.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user && !ehPublica(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (!ehBloqueado(error)) return NextResponse.redirect(url);

    url.searchParams.set("erro", "bloqueado");
    const redirecionamento = NextResponse.redirect(url);
    request.cookies
      .getAll()
      .filter(({ name }) => name.startsWith("sb-"))
      .forEach(({ name }) => redirecionamento.cookies.delete(name));
    return redirecionamento;
  }

  return resposta;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
