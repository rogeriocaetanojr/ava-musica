import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ehBloqueado } from "./app/login/mensagens";
import { COOKIE_ULTIMO_USO, semValidade, sessaoExpirou } from "./lib/sessao";

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

// Nomes dos cookies do login e do último uso, para apagar ao encerrar a sessão.
function cookiesDaSessao(request: NextRequest): string[] {
  return request.cookies
    .getAll()
    .map(({ name }) => name)
    .filter((nome) => nome.startsWith("sb-") || nome === COOKIE_ULTIMO_USO);
}

function paraLogin(request: NextRequest, erro?: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  if (erro) url.searchParams.set("erro", erro);
  return NextResponse.redirect(url);
}

// Renova a sessão a cada requisição e manda para /login quem não está logado.
// A conta bloqueada pelo professor tem a sessão recusada pelo Supabase
// (user_banned): os cookies são apagados e o aluno vê o aviso no login.
// Depois de 2 horas sem uso (ver lib/sessao.ts), a sessão é encerrada.
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
            resposta.cookies.set(name, value, semValidade(options)),
          );
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  const publica = ehPublica(request.nextUrl.pathname);

  if (
    user &&
    sessaoExpirou(request.cookies.get(COOKIE_ULTIMO_USO)?.value, Date.now())
  ) {
    // Encerra só esta sessão (o professor continua logado em outro aparelho).
    await supabase.auth.signOut({ scope: "local" });
    const nomes = cookiesDaSessao(request);
    nomes.forEach((nome) => request.cookies.delete(nome));
    const saida = publica
      ? NextResponse.next({ request })
      : paraLogin(request, "sessao-expirada");
    nomes.forEach((nome) => saida.cookies.delete(nome));
    return saida;
  }

  if (user) {
    resposta.cookies.set(COOKIE_ULTIMO_USO, String(Date.now()), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
    return resposta;
  }

  if (!publica) {
    const redirecionamento = paraLogin(
      request,
      ehBloqueado(error) ? "bloqueado" : undefined,
    );
    if (ehBloqueado(error))
      cookiesDaSessao(request).forEach((nome) =>
        redirecionamento.cookies.delete(nome),
      );
    else if (request.cookies.has(COOKIE_ULTIMO_USO))
      redirecionamento.cookies.delete(COOKIE_ULTIMO_USO);
    return redirecionamento;
  }

  // Sem sessão, o registro de uso de uma sessão antiga não vale mais.
  if (request.cookies.has(COOKIE_ULTIMO_USO))
    resposta.cookies.delete(COOKIE_ULTIMO_USO);
  return resposta;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
