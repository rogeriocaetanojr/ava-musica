import { validarNome } from "@/lib/nomes";
import { erroDaSenha } from "@/lib/senha";

export type DadosDaConta = { nome: string; email: string; senha: string };

// Validação simples de formato; quem confirma o e-mail é o link enviado.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Confere os campos de Criar conta antes de chamar o Auth, que confere a senha
// de novo (mínimo do supabase/config.toml).
export function validarCriarConta(campos: {
  nome: unknown;
  email: unknown;
  senha: unknown;
}): { ok: true; dados: DadosDaConta } | { ok: false; erro: string } {
  const nome = validarNome(campos.nome);
  if (!nome.ok) return nome;

  const email =
    typeof campos.email === "string" ? campos.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email) || email.length > 254)
    return { ok: false, erro: "Informe um e-mail válido." };

  const erroSenha = erroDaSenha(campos.senha);
  if (erroSenha) return { ok: false, erro: erroSenha };

  return {
    ok: true,
    dados: { nome: nome.nome, email, senha: campos.senha as string },
  };
}
