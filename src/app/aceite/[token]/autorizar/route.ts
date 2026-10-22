import { NextResponse, type NextRequest } from "next/server";
import { urlDoSite, VERSAO_DOS_TERMOS } from "@/lib/site";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { ehTokenDeAceite } from "../../validacao";

// Recebe o "autorizo" da página pública do aceite. Não há sessão: quem protege
// é o token, que só vale uma vez (a gravação exige aceito_em ainda vazio).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const voltar = (caminho: string) =>
    NextResponse.redirect(new URL(caminho, request.nextUrl.origin), 303);

  if (!ehTokenDeAceite(token)) return voltar("/aceite/invalido");
  const formData = await request.formData();
  if (formData.get("autorizo") !== "sim")
    return voltar(`/aceite/${token}?erro=sem-autorizo`);

  const admin = criarClienteAdmin();
  const { data, error } = await admin
    .from("responsaveis")
    .update({
      aceito_em: new Date().toISOString(),
      versao_termos: VERSAO_DOS_TERMOS,
    })
    .eq("token", token)
    .is("aceito_em", null)
    .select("perfis (email)")
    .maybeSingle();
  if (error) return voltar(`/aceite/${token}?erro=falhou`);
  // Token inexistente ou já usado: a página explica o motivo.
  if (!data) return voltar(`/aceite/${token}`);

  const aluno = data.perfis as unknown as { email: string } | null;
  let enviado = false;
  if (aluno) {
    const { error: erroEnvio } = await admin.auth.signInWithOtp({
      email: aluno.email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: urlDoSite("/auth/callback"),
      },
    });
    enviado = !erroEnvio;
  }

  return voltar(`/aceite/concluido${enviado ? "" : "?envio=falhou"}`);
}
