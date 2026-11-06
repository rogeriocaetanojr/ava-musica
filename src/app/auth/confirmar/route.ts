import { NextResponse, type NextRequest } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { ehBloqueado, ehLimiteDeTentativas } from "../../login/mensagens";
import { concluirLogin } from "../concluir-login";

// Link do e-mail de confirmação de Criar conta (supabase/templates/
// confirmacao.html). Confirmar abre a sessão e segue pelo mesmo caminho do
// login: a conta vira pedido de acesso e a pessoa vai para a espera.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  if (!tokenHash || searchParams.get("type") !== "email")
    return NextResponse.redirect(`${origin}/login?erro=link-vencido`);

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email",
  });
  if (ehBloqueado(error)) return NextResponse.redirect(`${origin}/bloqueado`);
  if (ehLimiteDeTentativas(error))
    return NextResponse.redirect(`${origin}/login?erro=muitas-tentativas`);
  if (error) return NextResponse.redirect(`${origin}/login?erro=link-vencido`);

  return concluirLogin(origin);
}
