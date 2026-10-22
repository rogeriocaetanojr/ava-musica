// O token do aceite é gerado pelo banco: dois UUIDs juntos, sem hífens.
const TOKEN = /^[0-9a-f]{64}$/;

export function ehTokenDeAceite(valor: unknown): valor is string {
  return typeof valor === "string" && TOKEN.test(valor);
}
