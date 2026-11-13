// Regras da senha, as mesmas do Auth (supabase/config.toml e painel da nuvem).
export const SENHA_MINIMA = 8;
// O Auth guarda a senha com bcrypt, que só lê os primeiros 72 bytes.
export const SENHA_MAXIMA_EM_BYTES = 72;

// Devolve null quando a senha serve, ou a mensagem de erro.
export function erroDaSenha(valor: unknown): string | null {
  const senha = typeof valor === "string" ? valor : "";
  if (senha.length < SENHA_MINIMA)
    return `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
  if (new TextEncoder().encode(senha).length > SENHA_MAXIMA_EM_BYTES)
    return "A senha é longa demais. Use até 72 letras ou números.";
  if (!senha.trim()) return "A senha não pode ser só espaços.";
  return null;
}

// Cookie gravado quando a pessoa abre o link de "Esqueci minha senha": só com
// ele a tela /nova-senha aceita gravar a senha sem pedir a atual.
export const COOKIE_NOVA_SENHA = "nova-senha";
export const VALIDADE_DO_COOKIE_NOVA_SENHA_S = 15 * 60;

// Senha nova digitada duas vezes (/nova-senha e Trocar senha no perfil).
// Devolve null quando serve, ou a mensagem de erro.
export function erroDaNovaSenha(campos: {
  senha: unknown;
  confirmacao: unknown;
}): string | null {
  const erro = erroDaSenha(campos.senha);
  if (erro) return erro;
  if (campos.senha !== campos.confirmacao)
    return "As duas senhas não são iguais. Digite a mesma senha nos dois campos.";
  return null;
}
