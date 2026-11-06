import { createHash, randomBytes } from "node:crypto";

// Código do link /convite/<código>: 32 bytes aleatórios em base64url. O banco
// guarda só o hash, então quem lê a tabela não consegue montar o link.
export const VALIDADE_DO_CONVITE_EM_DIAS = 7;
const FORMATO = /^[A-Za-z0-9_-]{43}$/;

export function gerarCodigoDeConvite(): string {
  return randomBytes(32).toString("base64url");
}

export function hashDoConvite(codigo: string): string {
  return createHash("sha256").update(codigo).digest("hex");
}

export function ehCodigoDeConvite(valor: unknown): valor is string {
  return typeof valor === "string" && FORMATO.test(valor);
}

export type SituacaoDoConvite = "valido" | "usado" | "vencido";

export function situacaoDoConvite(
  convite: { expira_em: string; usado_em: string | null },
  agora: Date,
): SituacaoDoConvite {
  if (convite.usado_em) return "usado";
  if (new Date(convite.expira_em) <= agora) return "vencido";
  return "valido";
}
