// Nome e logo provisórios, até o professor enviar os definitivos.
export const NOME_DO_AVA = "AVA de Música";
export const LOGO_DO_AVA = "/logo.svg";

export function tituloDaPagina(titulo?: string): string {
  return titulo ? `${titulo} · ${NOME_DO_AVA}` : NOME_DO_AVA;
}

// Endereço completo de uma página do site, para links enviados por e-mail ou
// copiados pelo professor.
export function urlDoSite(caminho: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return new URL(caminho, base).href;
}

// Versão do texto da política e dos termos gravada junto com o aceite do
// responsável. Mudou o texto, mude a versão.
export const VERSAO_DOS_TERMOS = "1-rascunho";
