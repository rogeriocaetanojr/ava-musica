// Data e hora no horário de Brasília, como "22/10/2026, 14:30".
export function formatarDataHora(data: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

// Saudação pela hora de Brasília: bom dia até 11h59, boa tarde até 17h59.
export function saudacao(agora: Date = new Date()): string {
  const hora = Number(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "numeric",
      hourCycle: "h23",
    }).format(agora),
  );
  if (hora >= 5 && hora < 12) return "Bom dia";
  if (hora >= 12 && hora < 18) return "Boa tarde";
  return "Boa noite";
}

// Data por extenso no horário de Brasília, como "Quinta, 22 de outubro".
export function dataPorExtenso(agora: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).formatToParts(agora);
  const parte = (tipo: string) =>
    partes.find((p) => p.type === tipo)?.value ?? "";
  const dia = parte("weekday").replace("-feira", "");
  return `${dia.charAt(0).toLocaleUpperCase("pt-BR")}${dia.slice(1)}, ${parte("day")} de ${parte("month")}`;
}

// Dia no calendário de Brasília, como número de dias desde 1970.
function diaEmBrasilia(data: Date): number {
  const texto = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(data);
  return Math.round(Date.parse(`${texto}T00:00:00Z`) / 86_400_000);
}

// Quando, em relação a hoje no horário de Brasília: "hoje", "ontem",
// "há 3 dias" e, a partir de 7 dias, a data curta.
export function quandoFoi(data: string, agora: Date = new Date()): string {
  const dias = diaEmBrasilia(agora) - diaEmBrasilia(new Date(data));
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
  }).format(new Date(data));
}
