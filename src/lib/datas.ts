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
