export const MENSAGEM_NAO_CONVIDADO =
  "Este e-mail ainda não foi convidado. Peça ao professor para cadastrar você.";

// Limite de tentativas do login (supabase/config.toml e painel da nuvem).
export const MENSAGEM_MUITAS_TENTATIVAS =
  "Muitas tentativas de entrar em pouco tempo. Por segurança, o acesso foi pausado: espere alguns minutos e tente de novo. Se o problema continuar, avise o professor.";

const CODIGOS_DE_LIMITE = [
  "over_email_send_rate_limit",
  "over_request_rate_limit",
];

export function ehLimiteDeTentativas(
  erro: { status?: number; code?: string } | null | undefined,
): boolean {
  return (
    !!erro &&
    (erro.status === 429 || CODIGOS_DE_LIMITE.includes(erro.code ?? ""))
  );
}
