import { NextResponse, type NextRequest } from "next/server";
import { VERSAO_DOS_TERMOS } from "@/lib/site";
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
    .select("aluno_id")
    .maybeSingle();
  if (error) return voltar(`/aceite/${token}?erro=falhou`);
  // Token inexistente ou já usado: a página explica o motivo.
  if (!data) return voltar(`/aceite/${token}`);

  // O aluno já recebeu o convite por e-mail; com o aceite, a senha que ele
  // escolheu passa a abrir as aulas.
  return voltar("/aceite/concluido");
}
