// Limite de convites (e reenvios) por hora. Quem garante é a política da
// tabela envios_convite; a contagem prévia só dá uma mensagem mais clara.
export const LIMITE_DE_CONVITES_POR_HORA = 20;

export const MENSAGEM_LIMITE_DE_CONVITES = `Você já enviou ${LIMITE_DE_CONVITES_POR_HORA} convites na última hora, o limite de segurança. Espere um pouco e tente de novo.`;

type Erro = { code?: string } | null;

// O mínimo do cliente do Supabase usado aqui, para os testes usarem um falso.
export type ClienteConvites = {
  rpc(nome: "convites_na_ultima_hora"): PromiseLike<{
    data: number | null;
    error: Erro;
  }>;
  from(tabela: "envios_convite"): {
    insert(linha: Record<string, never>): PromiseLike<{ error: Erro }>;
  };
};

export type Reserva = { ok: true } | { ok: false; erro: string };

// Reserva uma vaga antes de enviar o e-mail; a vaga conta mesmo se o envio falhar.
export async function reservarEnvioDeConvite(
  supabase: ClienteConvites,
): Promise<Reserva> {
  const falha =
    "Não foi possível conferir o limite de convites. Tente de novo.";

  const { data: enviados, error } = await supabase.rpc(
    "convites_na_ultima_hora",
  );
  if (error || enviados === null) return { ok: false, erro: falha };
  if (enviados >= LIMITE_DE_CONVITES_POR_HORA)
    return { ok: false, erro: MENSAGEM_LIMITE_DE_CONVITES };

  const { error: erroInsercao } = await supabase
    .from("envios_convite")
    .insert({});
  // 42501: a política recusou (outro envio ocupou a última vaga).
  if (erroInsercao?.code === "42501")
    return { ok: false, erro: MENSAGEM_LIMITE_DE_CONVITES };
  if (erroInsercao) return { ok: false, erro: falha };
  return { ok: true };
}
