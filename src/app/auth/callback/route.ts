import { NextResponse, type NextRequest } from "next/server";
import { destinoDoPapel, obterSessao } from "@/lib/auth";
import { criarClienteServidor } from "@/lib/supabase/servidor";

// Recebe o retorno do Google e do link mágico e cria a sessão.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const codigo = searchParams.get("code");

  // Com o cadastro aberto desligado, o Google volta com erro para quem não foi convidado.
  if (searchParams.get("error")) {
    return NextResponse.redirect(`${origin}/login?erro=nao-convidado`);
  }
  if (!codigo) {
    return NextResponse.redirect(`${origin}/login?erro=link-invalido`);
  }

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.exchangeCodeForSession(codigo);
  if (error) {
    return NextResponse.redirect(`${origin}/login?erro=link-invalido`);
  }

  const sessao = await obterSessao();
  if (!sessao) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?erro=nao-convidado`);
  }

  return NextResponse.redirect(`${origin}${destinoDoPapel(sessao.papel)}`);
}
