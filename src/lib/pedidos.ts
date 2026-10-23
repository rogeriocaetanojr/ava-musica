import "server-only";
import { mensagemDePedidoNovo } from "@/lib/email";
import { enviarAoProfessor } from "@/lib/enviar-email";
import { urlDoSite } from "@/lib/site";
import { criarClienteAdmin } from "@/lib/supabase/admin";

// Avisa o professor por e-mail, uma vez só, de que o aluno pendente entrou.
// A marcação é feita antes do envio e só vale para quem ainda não foi avisado,
// então dois logins seguidos não mandam dois e-mails. Se o envio falhar, a
// marcação é desfeita para tentar de novo no próximo login.
export async function avisarPedidoNovo(aluno: {
  id: string;
  nome: string;
  email: string;
}): Promise<void> {
  const admin = criarClienteAdmin();
  const { data: marcado } = await admin
    .from("perfis")
    .update({ pedido_avisado_em: new Date().toISOString() })
    .eq("id", aluno.id)
    .is("liberado_em", null)
    .is("pedido_avisado_em", null)
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
