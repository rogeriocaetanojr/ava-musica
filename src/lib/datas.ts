// Data e hora no horário de Brasília, como "22/10/2026, 14:30".
export function formatarDataHora(data: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}
