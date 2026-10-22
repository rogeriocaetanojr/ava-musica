export const NOME_DO_AVA = "AVA de Música";

export function tituloDaPagina(titulo?: string): string {
  return titulo ? `${titulo} · ${NOME_DO_AVA}` : NOME_DO_AVA;
}

// Endereço completo de uma página do site, para links enviados por e-mail ou
// copiados pelo professor.
export function urlDoSite(caminho: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return new URL(caminho, base).href;
}
