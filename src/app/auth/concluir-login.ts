import "server-only";
import { NextResponse } from "next/server";
import { destinoDoPapel, obterSessao } from "@/lib/auth";
import { confirmarPedido } from "@/lib/pedidos";
import { criarClienteServidor } from "@/lib/supabase/servidor";

// Depois que a sessão foi criada (código do e-mail ou volta do Google), manda
// cada pessoa para o lugar certo.
export async function concluirLogin(origin: string): Promise<NextResponse> {
  const sessao = await obterSessao();
  if (!sessao) {
    const supabase = await criarClienteServidor();
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?erro=nao-convidado`);
  }
  if (sessao.bloqueado) {
    const supabase = await criarClienteServidor();
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?erro=bloqueado`);
  }
  // Quem entrou sem cadastro do professor (Google ou código por e-mail)
  // confirma o pedido aqui: só agora ele aparece para o professor, que é
  // avisado.
  if (sessao.pendente) {
    await confirmarPedido(sessao);
    return NextResponse.redirect(`${origin}/aguardando`);
  }

  return NextResponse.redirect(`${origin}${destinoDoPapel(sessao.papel)}`);
}
