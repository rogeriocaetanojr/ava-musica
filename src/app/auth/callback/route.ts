import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import {
  COOKIE_NOVA_SENHA,
  VALIDADE_DO_COOKIE_NOVA_SENHA_S,
} from "@/lib/senha";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import {
  ehBloqueado,
  ehLimiteDeTentativas,
  ehPedidoBarrado,
} from "../../login/mensagens";
import { concluirLogin } from "../concluir-login";

// Link do e-mail de "Esqueci minha senha" (supabase/templates/nova-senha.html).
// Abre a sessão e leva à tela /nova-senha; o cookie marca que a pessoa veio
// pelo link, e só com ele a tela grava a senha sem pedir a atual.
async function abrirNovaSenha(tokenHash: string, origin: string) {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "recovery",
  });
  if (ehBloqueado(error)) return NextResponse.redirect(`${origin}/bloqueado`);
  if (ehLimiteDeTentativas(error))
    return NextResponse.redirect(`${origin}/login?erro=muitas-tentativas`);
  if (error)
    return NextResponse.redirect(`${origin}/login?erro=link-senha-vencido`);

  (await cookies()).set(COOKIE_NOVA_SENHA, "1", {
    path: "/nova-senha",
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https:"),
    maxAge: VALIDADE_DO_COOKIE_NOVA_SENHA_S,
  });
  return NextResponse.redirect(`${origin}/nova-senha`);
}

// Recebe o retorno do Google e cria a sessão, e também o link de "Esqueci
// minha senha". O login por senha vai direto para /auth/concluir, e a
// confirmação de Criar conta, para /auth/confirmar.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const codigo = searchParams.get("code");

  const tokenHash = searchParams.get("token_hash");
  if (tokenHash && searchParams.get("type") === "recovery")
    return abrirNovaSenha(tokenHash, origin);

  // A conta bloqueada volta com error_code=user_banned e a recusada há menos
  // de 7 dias, com a mensagem do hook; qualquer outro erro do Google (como
  // cancelar a escolha da conta) mostra o aviso de falha do Google.
  if (searchParams.get("error_code") === "user_banned") {
    return NextResponse.redirect(`${origin}/bloqueado`);
  }
  if (
    ehPedidoBarrado({
      message: searchParams.get("error_description") ?? undefined,
    })
  ) {
    return NextResponse.redirect(`${origin}/login?erro=pedido-barrado`);
  }
  if (searchParams.get("error") || !codigo) {
    return NextResponse.redirect(`${origin}/login?erro=google`);
  }

  const supabase = await criarClienteServidor();
  const { error: erro } = await supabase.auth.exchangeCodeForSession(codigo);
  if (ehBloqueado(erro)) {
    return NextResponse.redirect(`${origin}/bloqueado`);
  }
  if (ehLimiteDeTentativas(erro)) {
    return NextResponse.redirect(`${origin}/login?erro=muitas-tentativas`);
  }
  if (erro) {
    return NextResponse.redirect(`${origin}/login?erro=google`);
  }

  return concluirLogin(origin);
}
