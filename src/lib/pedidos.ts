import "server-only";
import { mensagemDePedidoNovo } from "@/lib/email";
import { enviarAoProfessor } from "@/lib/enviar-email";
import { urlDoSite } from "@/lib/site";
import { criarClienteAdmin } from "@/lib/supabase/admin";

// Confirma o pedido do aluno pendente que acabou de entrar (confirmou o
// código ou voltou do Google): marca pedido_em na primeira vez, o que põe o pedido
// na lista do professor, e avisa o professor. Só vale para quem já informou o
// nome: o professor nunca vê o e-mail no lugar do nome.
//
// O aviso por e-mail sai uma vez só. A marcação é feita antes do envio e só
// vale para quem ainda não foi avisado, então dois logins seguidos não mandam
// dois e-mails. Se o envio falhar, a marcação é desfeita para tentar de novo
// no próximo login.
export async function confirmarPedido(aluno: {
  id: string;
  nome: string;
  email: string;
}): Promise<void> {
  const admin = criarClienteAdmin();
  await admin
    .from("perfis")
    .update({ pedido_em: new Date().toISOString() })
    .eq("id", aluno.id)
    .is("liberado_em", null)
    .is("pedido_em", null)
    .not("nome", "is", null);

  const { data: marcado } = await admin
    .from("perfis")
    .update({ pedido_avisado_em: new Date().toISOString() })
    .eq("id", aluno.id)
    .is("liberado_em", null)
    .is("pedido_avisado_em", null)
    .not("pedido_em", "is", null)
    .select("id");
  if (!marcado?.length) return;

  const enviado = await enviarAoProfessor(
    mensagemDePedidoNovo(aluno, urlDoSite("/professor")),
  );
  if (!enviado)
    await admin
      .from("perfis")
      .update({ pedido_avisado_em: null })
      .eq("id", aluno.id);
}
