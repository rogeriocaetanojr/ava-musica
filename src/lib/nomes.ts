// Conta que ainda não informou o nome (sobra de antes do nome obrigatório):
// as telas mostram este aviso, nunca o e-mail.
export const SEM_NOME = "Sem nome";

export function nomeParaExibir(nome: string | null | undefined): string {
  return nome?.trim() ? nome : SEM_NOME;
}

// Iniciais do avatar: primeira letra do primeiro e do último nome.
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toLocaleUpperCase("pt-BR");
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
