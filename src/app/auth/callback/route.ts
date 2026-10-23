import { NextResponse, type NextRequest } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import {
  ehBloqueado,
  ehLimiteDeTentativas,
  ehPedidoBarrado,
} from "../../login/mensagens";
import { concluirLogin } from "../concluir-login";

// Recebe o retorno do Google e cria a sessão. O e-mail entra por código,
// confirmado na própria tela de login (ver /auth/concluir).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const codigo = searchParams.get("code");

  // A conta bloqueada volta com error_code=user_banned e a recusada há menos
  // de 7 dias, com a mensagem do hook; qualquer outro erro do Google (como
  // cancelar a escolha da conta) mostra o aviso de falha do Google.
  if (searchParams.get("error_code") === "user_banned") {
    return NextResponse.redirect(`${origin}/login?erro=bloqueado`);
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
    return NextResponse.redirect(`${origin}/login?erro=bloqueado`);
  }
  if (ehLimiteDeTentativas(erro)) {
    return NextResponse.redirect(`${origin}/login?erro=muitas-tentativas`);
  }
  if (erro) {
    return NextResponse.redirect(`${origin}/login?erro=google`);
  }

  return concluirLogin(origin);
}
