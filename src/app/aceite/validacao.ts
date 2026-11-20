import { createHash, randomBytes } from "node:crypto";

// Código do link /aceite/<código>, como no convite do aluno: 32 bytes
// aleatórios em base64url. O banco guarda só o SHA-256 (token_hash) e a data
// em que o link vence; quem lê a tabela não consegue montar o link.
export const VALIDADE_DO_ACEITE_EM_DIAS = 7;
const FORMATO = /^[A-Za-z0-9_-]{43}$/;

export function gerarTokenDeAceite(): string {
  return randomBytes(32).toString("base64url");
}

export function hashDoTokenDeAceite(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function ehTokenDeAceite(valor: unknown): valor is string {
  return typeof valor === "string" && FORMATO.test(valor);
}

// Data em que vence um link gerado agora.
export function vencimentoDoAceite(agora: number): string {
  return new Date(
    agora + VALIDADE_DO_ACEITE_EM_DIAS * 24 * 60 * 60 * 1000,
  ).toISOString();
}

export type SituacaoDoAceite = "valido" | "aceito" | "vencido";

export function situacaoDoAceite(
  responsavel: { aceito_em: string | null; expira_em: string | null },
  agora: Date,
): SituacaoDoAceite {
  if (responsavel.aceito_em) return "aceito";
  if (!responsavel.expira_em || new Date(responsavel.expira_em) <= agora)
    return "vencido";
  return "valido";
}
