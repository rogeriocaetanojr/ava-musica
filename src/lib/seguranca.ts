// Cabeçalhos de segurança do site (S2 da auditoria) e conferência de origem
// das rotas POST (S7). Funções puras, usadas pelo next.config.ts, pelo
// proxy.ts e pelas rotas.

// Onde o site incorpora conteúdo de fora: o vídeo do YouTube (sem cookies) e o
// captcha da Cloudflare, que roda num iframe próprio.
const FRAMES = [
  "https://www.youtube-nocookie.com",
  "https://challenges.cloudflare.com",
];
// O script do captcha, carregado pelo código do site.
const SCRIPTS_DE_FORA = ["https://challenges.cloudflare.com"];

// Origem (protocolo, host e porta) de um endereço, como o do Supabase (de onde
// o navegador lê os dados e toca o áudio do Storage) ou o do site.
export function origemDaUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export type OpcoesDaCsp = {
  nonce: string;
  // Hashes (sha256-…) dos scripts inline fixos, como o do tema.
  hashes: string[];
  supabaseUrl?: string;
  // O React usa eval só no modo de desenvolvimento.
  desenvolvimento: boolean;
};

// Trecho fixo que o React escreve no esqueleto estático da página (PPR), que
// sai do build sem nonce. O npm run dev não tem esqueleto estático, então os
// testes de ponta a ponta não acusam se uma versão nova do React mudar o
// texto: depois de atualizar, confira o build de produção (ver ANDAMENTO.md).
// O resto da página é renderizado a cada requisição (ver app/layout.tsx).
export const SCRIPT_FIXO_DO_REACT =
  "requestAnimationFrame(function(){$RT=performance.now()});";

// Content-Security-Policy de cada página. Sem 'unsafe-inline' para script:
// - os arquivos do Next vêm do próprio site ('self');
// - os scripts inline gerados na requisição levam o nonce, que o Next aplica
//   sozinho ao ler este cabeçalho;
// - os inline fixos do esqueleto estático (o do tema e o do React) são
//   liberados pelo hash, porque o esqueleto sai do build, sem nonce.
// Não dá para usar 'strict-dynamic': ele ignora o 'self', e os arquivos do
// esqueleto estático não têm nonce.
// O estilo inline continua liberado: o React grava style="" (a largura das
// barras de progresso) e o captcha injeta o próprio CSS; CSS não executa
// código.
export function montarCsp({
  nonce,
  hashes,
  supabaseUrl,
  desenvolvimento,
}: OpcoesDaCsp): string {
  const supabase = origemDaUrl(supabaseUrl);
  const deSupabase = supabase ? [supabase] : [];
  const https = supabase?.startsWith("https:") ?? false;

  const diretivas: [string, string[]][] = [
    ["default-src", ["'self'"]],
    [
      "script-src",
      [
        "'self'",
        `'nonce-${nonce}'`,
        ...hashes.map((hash) => `'${hash}'`),
        ...SCRIPTS_DE_FORA,
        ...(desenvolvimento ? ["'unsafe-eval'"] : []),
      ],
    ],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["img-src", ["'self'", "data:", "blob:"]],
    ["font-src", ["'self'"]],
    ["connect-src", ["'self'", ...deSupabase]],
    ["media-src", ["'self'", ...deSupabase]],
    ["frame-src", FRAMES],
    ["worker-src", ["'self'", "blob:"]],
    ["manifest-src", ["'self'"]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
    ["frame-ancestors", ["'none'"]],
  ];
  const partes = diretivas.map(([nome, valores]) =>
    [nome, ...valores].join(" "),
  );
  // No computador o Supabase local é http; lá o upgrade quebraria as chamadas.
  if (https && !desenvolvimento) partes.push("upgrade-insecure-requests");
  return partes.join("; ");
}

// Cabeçalhos fixos de toda resposta, inclusive arquivos estáticos.
export const CABECALHOS_DE_SEGURANCA: { key: string; value: string }[] = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Reforço do frame-ancestors 'none' para navegadores antigos.
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  // Só vale em https; o navegador ignora no http do computador.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

// Nonce novo a cada requisição: 16 bytes aleatórios em base64.
export function gerarNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

// Hash sha256 (no formato da CSP) de um script inline.
export async function hashDoScript(conteudo: string): Promise<string> {
  const resumo = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(conteudo),
  );
  return `sha256-${btoa(String.fromCharCode(...new Uint8Array(resumo)))}`;
}

// S7: um POST só vale se veio de uma página do próprio site. Os navegadores
// mandam o Origin em todo POST; sem ele, vale o Sec-Fetch-Site. Pedido sem
// nenhum dos dois não vem de navegador e não é CSRF, mas também é recusado.
export function origemConfere(
  cabecalhos: Headers,
  origemDoSite: string,
  outrasOrigens: (string | undefined)[] = [],
): boolean {
  const permitidas = new Set([
    origemDoSite,
    ...outrasOrigens
      .map((url) => origemDaUrl(url))
      .filter((origem): origem is string => origem !== null),
  ]);
  const origem = cabecalhos.get("origin");
  if (origem) return permitidas.has(origem);
  return cabecalhos.get("sec-fetch-site") === "same-origin";
}

// Primeira linha das rotas POST: devolve a recusa (403) quando o pedido veio
// de outro site, ou null quando pode seguir. Vale a origem em que o pedido
// chegou e a do NEXT_PUBLIC_SITE_URL.
export function recusarOutraOrigem(request: {
  headers: Headers;
  nextUrl: { origin: string };
}): Response | null {
  if (
    origemConfere(request.headers, request.nextUrl.origin, [
      process.env.NEXT_PUBLIC_SITE_URL,
    ])
  )
    return null;
  return new Response("Pedido recusado: origem não confere.", {
    status: 403,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
