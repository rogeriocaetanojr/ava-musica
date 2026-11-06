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
