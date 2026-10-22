export const NOME_DO_AVA = "AVA de Música";

export function tituloDaPagina(titulo?: string): string {
  return titulo ? `${titulo} · ${NOME_DO_AVA}` : NOME_DO_AVA;
}
