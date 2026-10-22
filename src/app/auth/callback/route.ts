import { NextResponse, type NextRequest } from "next/server";
import { destinoDoPapel, obterSessao } from "@/lib/auth";
import { criarClienteServidor } from "@/lib/supabase/servidor";

// Tipos de link aceitos com token_hash: o convite e o link mágico.
const TIPOS_DE_LINK = ["invite", "email"] as const;
type TipoDeLink = (typeof TIPOS_DE_LINK)[number];

function ehTipoDeLink(valor: string | null): valor is TipoDeLink {
  return (TIPOS_DE_LINK as readonly (string | null)[]).includes(valor);
}

// Recebe o retorno do Google, do link mágico e do convite e cria a sessão.
// O convite é gerado pelo servidor, sem o código guardado no navegador, por
// isso chega com token_hash (ver supabase/templates/convite.html).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const codigo = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type");

  // Com o cadastro aberto desligado, o Google volta com erro para quem não foi convidado.
  if (searchParams.get("error")) {
    return NextResponse.redirect(`${origin}/login?erro=nao-convidado`);
  }

  const supabase = await criarClienteServidor();
  let falhou: boolean;
  if (codigo) {
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    falhou = Boolean(error);
  } else if (tokenHash && ehTipoDeLink(tipo)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: tipo,
    });
    falhou = Boolean(error);
  } else {
    falhou = true;
  }
  if (falhou) {
    return NextResponse.redirect(`${origin}/login?erro=link-invalido`);
  }

  const sessao = await obterSessao();
  if (!sessao) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?erro=nao-convidado`);
  }

  return NextResponse.redirect(`${origin}${destinoDoPapel(sessao.papel)}`);
}
