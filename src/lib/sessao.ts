// A sessão não fica salva no aparelho: os cookies do login são de sessão (sem
// data de validade, somem ao fechar o navegador) e a sessão termina depois de
// 2 horas sem uso, para alunos e professor. O último uso fica num cookie
// próprio, atualizado pelo proxy a cada requisição de quem está logado.

export const COOKIE_ULTIMO_USO = "ultimo-uso";
export const LIMITE_SEM_USO_MS = 2 * 60 * 60 * 1000;

type OpcoesDeCookie = { maxAge?: number; expires?: Date };

// Tira a validade dos cookies gravados pelo Supabase, que por padrão duram
// 400 dias. A remoção (maxAge 0) continua valendo, senão o cookie não sai.
export function semValidade<T extends OpcoesDeCookie>(opcoes: T): T {
  if (opcoes.maxAge === 0) return opcoes;
  const resto = { ...opcoes };
  delete resto.maxAge;
  delete resto.expires;
  return resto;
}

// Sem registro de uso, a sessão acabou de começar. Um valor que não é número
// é tratado como vencido.
export function sessaoExpirou(
  ultimoUso: string | undefined,
  agora: number,
): boolean {
  if (ultimoUso === undefined) return false;
  const instante = Number(ultimoUso);
  if (!Number.isFinite(instante)) return true;
  return agora - instante > LIMITE_SEM_USO_MS;
}
