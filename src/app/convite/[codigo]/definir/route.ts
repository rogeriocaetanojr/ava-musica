import { NextResponse, type NextRequest } from "next/server";
import { ehCodigoDeConvite, hashDoConvite } from "@/lib/convites";
import { erroDaSenha } from "@/lib/senha";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { ehBloqueado } from "../../../login/mensagens";

// Recebe a senha escolhida na página do convite. Não há sessão: quem protege
// é o código do link, que vale 7 dias e uma vez só. Por isso é uma rota, e
// não uma server action, que exigiria alguém logado.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo } = await params;
  const origin = request.nextUrl.origin;
  // 303: o navegador segue com GET, e não reenvia o formulário.
  const voltar = (caminho: string) =>
    NextResponse.redirect(new URL(caminho, origin), 303);

  if (!ehCodigoDeConvite(codigo)) return voltar("/convite/invalido");
  const formData = await request.formData();
  const senha = formData.get("senha");
  const captcha = formData.get("captcha");
  if (erroDaSenha(senha) || typeof senha !== "string")
    return voltar(`/convite/${codigo}?erro=senha`);

  // Marca o convite como usado antes de tudo: a gravação só acontece se ele
  // ainda vale, então dois envios seguidos não usam o mesmo link.
  const admin = criarClienteAdmin();
  const { data: convite, error } = await admin
    .from("convites")
    .update({ usado_em: new Date().toISOString() })
    .eq("codigo_hash", hashDoConvite(codigo))
    .is("usado_em", null)
    .gt("expira_em", new Date().toISOString())
    .select("aluno_id, perfis (email)")
    .maybeSingle();
  if (error) return voltar(`/convite/${codigo}?erro=falhou`);
  // Inexistente, vencido ou já usado: a página explica o motivo.
  if (!convite) return voltar(`/convite/${codigo}`);
  const email = (convite.perfis as unknown as { email: string } | null)?.email;

  const { error: erroSenha } = await admin.auth.admin.updateUserById(
    convite.aluno_id,
    { password: senha },
  );
  if (erroSenha || !email) {
    // Sem a senha gravada, o link volta a valer para tentar de novo.
    await admin
      .from("convites")
      .update({ usado_em: null })
      .eq("aluno_id", convite.aluno_id);
    return voltar(
      `/convite/${codigo}?erro=${erroSenha?.code === "weak_password" ? "senha" : "falhou"}`,
    );
  }

  const supabase = await criarClienteServidor();
  const { error: erroLogin } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
    options: {
      captchaToken: typeof captcha === "string" ? captcha : undefined,
    },
  });
  if (ehBloqueado(erroLogin)) return voltar("/bloqueado");
  // A senha já está salva: falta só entrar pela tela de login.
  if (erroLogin) return voltar("/login?erro=senha-definida");

  return voltar("/auth/concluir");
}
