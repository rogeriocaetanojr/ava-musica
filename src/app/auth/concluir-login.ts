import "server-only";
import { NextResponse } from "next/server";
import { destinoDoPapel, obterSessao, TELA_DO_NOME } from "@/lib/auth";
import { confirmarPedido } from "@/lib/pedidos";
import { criarClienteServidor } from "@/lib/supabase/servidor";

// Depois que a sessão foi criada (senha, link de confirmação, convite ou volta
// do Google), manda cada pessoa para o lugar certo.
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
    return NextResponse.redirect(`${origin}/bloqueado`);
  }
  // Sem nome (Google sem nome, ou conta antiga), a pessoa informa o nome
  // antes de qualquer outra tela; o pedido é confirmado depois, na tela do
  // nome.
  if (sessao.nome === null) {
    return NextResponse.redirect(`${origin}${TELA_DO_NOME}`);
  }
  // Quem entrou sem cadastro do professor (Google ou Criar conta)
  // confirma o pedido aqui: só agora ele aparece para o professor, que é
  // avisado.
  if (sessao.pendente) {
    await confirmarPedido({ ...sessao, nome: sessao.nome });
    return NextResponse.redirect(`${origin}/aguardando`);
  }

  return NextResponse.redirect(`${origin}${destinoDoPapel(sessao.papel)}`);
}
