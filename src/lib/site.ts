// Nome completo da escola: name do manifest, e-mails e textos legais.
export const NOME_DO_AVA = "Escola de Música John Meyer";
// Nome curto: título padrão, título das páginas e short_name do manifest.
export const NOME_CURTO_DO_AVA = "Escola John Meyer";
export const LOGO_DO_AVA = "/logo.svg";
// O logo traz o nome escrito; o texto alternativo repete o que está nele.
export const ALT_DO_LOGO = "John Meyer, Escola de Música";
// Onde fica o desenho dentro do logo.svg (quadro de 1024 × 1024), para
// cortar a margem em volta. Trocou o logo, meça de novo.
export const RECORTE_DO_LOGO = {
  x: 146.6,
  y: 219,
  largura: 736.3,
  altura: 304,
};
// Linha "Escola de Música", escondida quando o logo fica pequeno.
export const RECORTE_DO_SUBTITULO = {
  x: 304,
  y: 474,
  largura: 274,
  altura: 38,
};

export function tituloDaPagina(titulo?: string): string {
  return titulo ? `${titulo} · ${NOME_CURTO_DO_AVA}` : NOME_CURTO_DO_AVA;
}

// Endereço completo de uma página do site, para links enviados por e-mail ou
// copiados pelo professor.
export function urlDoSite(caminho: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return new URL(caminho, base).href;
}

// Versão do texto da política e dos termos gravada junto com o aceite do
// responsável. Mudou o texto, mude a versão.
export const VERSAO_DOS_TERMOS = "4-rascunho";
