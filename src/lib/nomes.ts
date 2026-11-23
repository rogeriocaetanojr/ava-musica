// Conta que ainda não informou o nome (sobra de antes do nome obrigatório):
// as telas mostram este aviso, nunca o e-mail.
export const SEM_NOME = "Sem nome";

export function nomeParaExibir(nome: string | null | undefined): string {
  return nome?.trim() ? nome : SEM_NOME;
}

// Primeiro nome, para saudações ("Olá, Ana").
export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? "";
}

export const TAMANHO_MAXIMO_DO_NOME = 120;

// Nome completo digitado (tela do nome e ficha do aluno): sem espaços nas
// pontas nem repetidos no meio. Devolve o nome ou a mensagem de erro; o banco
// confere de novo.
export function validarNome(
  valor: unknown,
): { ok: true; nome: string } | { ok: false; erro: string } {
  const nome =
    typeof valor === "string" ? valor.trim().replace(/\s+/g, " ") : "";
  if (!nome) return { ok: false, erro: "Informe o nome completo." };
  if (nome.length > TAMANHO_MAXIMO_DO_NOME)
    return {
      ok: false,
      erro: `O nome pode ter no máximo ${TAMANHO_MAXIMO_DO_NOME} caracteres.`,
    };
  if (nome.includes("@"))
    return { ok: false, erro: "Digite o seu nome, não o e-mail." };
  return { ok: true, nome };
}
