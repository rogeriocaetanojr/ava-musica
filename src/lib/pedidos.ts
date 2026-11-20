import "server-only";
import { mensagemDePedidoNovo } from "@/lib/email";
import { enviarAoProfessor } from "@/lib/enviar-email";
import { urlDoSite } from "@/lib/site";
import { criarClienteAdmin } from "@/lib/supabase/admin";

// Confirma o pedido do aluno pendente que acabou de entrar (abriu o link de
// confirmação de Criar conta ou voltou do Google): marca pedido_em na primeira
// vez, o que põe o pedido na lista do professor, e avisa o professor. Só vale
// para quem já informou o nome: o professor nunca vê o e-mail no lugar do nome.
//
// Devolve false quando o pedido não foi registrado no banco: sem pedido_em, o
// professor não vê a pessoa, então quem chama precisa avisar. Repetir é
// seguro: a marcação só vale para quem ainda não tem.
//
// O aviso por e-mail sai uma vez só. A marcação é feita antes do envio e só
// vale para quem ainda não foi avisado, então dois logins seguidos não mandam
// dois e-mails. Se o envio falhar, a marcação é desfeita para tentar de novo
// no próximo login. O aviso é um extra: se ele falhar, o pedido continua no
// painel, então não é erro para a pessoa.
export async function confirmarPedido(aluno: {
  id: string;
  nome: string;
  email: string;
}): Promise<boolean> {
  const admin = criarClienteAdmin();
  const { error: erroPedido } = await admin
    .from("perfis")
    .update({ pedido_em: new Date().toISOString() })
    .eq("id", aluno.id)
    .is("liberado_em", null)
    .is("pedido_em", null)
    .not("nome", "is", null);
  if (erroPedido) {
    console.error("Falha ao registrar o pedido de acesso:", erroPedido.code);
    return false;
  }

  const { data: marcado, error: erroAviso } = await admin
    .from("perfis")
    .update({ pedido_avisado_em: new Date().toISOString() })
    .eq("id", aluno.id)
    .is("liberado_em", null)
    .is("pedido_avisado_em", null)
    .not("pedido_em", "is", null)
    .select("id");
  if (erroAviso) {
    console.error("Falha ao marcar o aviso do pedido:", erroAviso.code);
    return true;
  }
  if (!marcado?.length) return true;

  const enviado = await enviarAoProfessor(
    mensagemDePedidoNovo(aluno, urlDoSite("/professor")),
  );
  if (!enviado) {
    const { error: erroDesfazer } = await admin
      .from("perfis")
      .update({ pedido_avisado_em: null })
      .eq("id", aluno.id);
    if (erroDesfazer)
      console.error("Falha ao desfazer o aviso do pedido:", erroDesfazer.code);
  }
  return true;
}
