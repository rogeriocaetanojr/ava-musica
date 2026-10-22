// Regra dos 12 anos. As datas são texto no formato AAAA-MM-DD, como vêm do
// campo de data do formulário e da coluna date do banco.

export const IDADE_MINIMA_SEM_ACEITE = 12;

const DATA = /^(\d{4})-(\d{2})-(\d{2})$/;

// Confere o formato e se o dia existe no calendário (recusa 2023-02-29).
export function ehDataValida(valor: string): boolean {
  const partes = DATA.exec(valor);
  if (!partes) return false;
  const [ano, mes, dia] = partes.slice(1).map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  );
}

// Data de hoje no fuso de Brasília, para o aniversário virar à meia-noite daqui
// e não à meia-noite UTC (21h no Brasil).
export function hojeNoBrasil(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
}

// Anos completos. O aniversário conta no próprio dia; quem nasceu em 29 de
// fevereiro faz aniversário em 1º de março nos anos não bissextos.
export function calcularIdade(nascimento: string, hoje: string): number {
  if (!ehDataValida(nascimento) || !ehDataValida(hoje))
    throw new Error("Data inválida.");

  const anos = Number(hoje.slice(0, 4)) - Number(nascimento.slice(0, 4));
  const jaFezAniversario = hoje.slice(5) >= nascimento.slice(5);
  return jaFezAniversario ? anos : anos - 1;
}

export function precisaDeAceite(nascimento: string, hoje: string): boolean {
  return calcularIdade(nascimento, hoje) < IDADE_MINIMA_SEM_ACEITE;
}
