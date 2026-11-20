// Leitura dos links colados pelo professor: descobre o serviço e monta o
// endereço seguro. Só o YouTube é incorporado na aula; o resto abre em nova
// guia. Funções puras, usadas no servidor
// (validação) e no navegador (pré-visualização).

export const TIPOS_DE_BLOCO = [
  "texto",
  "youtube",
  "drive",
  "audio",
  "link",
  "prova",
] as const;

export type TipoDeBloco = (typeof TIPOS_DE_BLOCO)[number];

export function ehTipoDeBloco(valor: unknown): valor is TipoDeBloco {
  return (TIPOS_DE_BLOCO as readonly unknown[]).includes(valor);
}

// Texto que o professor coloca no link pré-preenchido do Forms. O site troca
// pelo código do aluno, nunca pelo e-mail: a URL fica no histórico, nos logs
// do Google e no Referer. O marcador antigo (EMAIL_DO_ALUNO) também vira o
// código, para os links já cadastrados não mandarem o e-mail.
export const MARCADOR_CODIGO = "CODIGO_DO_ALUNO";
const MARCADOR_ANTIGO = "EMAIL_DO_ALUNO";

// Código do aluno nas provas: os 8 primeiros caracteres do id, em maiúsculas.
// Não revela nada da pessoa; o professor vê o código na ficha do aluno.
export function codigoDoAluno(id: string): string {
  return id.replaceAll("-", "").slice(0, 8).toUpperCase();
}

export type Embed =
  | { tipo: "youtube"; id: string; src: string }
  | { tipo: "drive"; id: string; abrir: string; baixar: string }
  | { tipo: "forms"; url: string }
  | { tipo: "audio"; src: string }
  | { tipo: "link"; url: string };

// Só aceita https, sem usuário e senha no endereço. Bloqueia javascript:,
// data:, http: e qualquer outro protocolo.
export function lerUrlHttps(link: string): URL | null {
  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  return url;
}

const ID_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;
const HOSTS_YOUTUBE = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
];

// watch?v=, youtu.be/, shorts/, embed/ e live/.
export function lerYoutube(link: string): Embed | null {
  const url = lerUrlHttps(link);
  if (!url) return null;

  let id: string | null = null;
  const partes = url.pathname.split("/").filter(Boolean);
  if (url.hostname === "youtu.be") {
    if (partes.length === 1) id = partes[0];
  } else if (HOSTS_YOUTUBE.includes(url.hostname)) {
    if (partes.length === 1 && partes[0] === "watch") {
      id = url.searchParams.get("v");
    } else if (
      partes.length === 2 &&
      ["shorts", "embed", "live"].includes(partes[0])
    ) {
      id = partes[1];
    }
  }

  if (!id || !ID_YOUTUBE.test(id)) return null;
  return {
    tipo: "youtube",
    id,
    src: `https://www.youtube-nocookie.com/embed/${id}`,
  };
}

const ID_DRIVE = /^[A-Za-z0-9_-]{10,}$/;

// file/d/<id>, open?id=<id> e uc?id=<id>.
export function lerDrive(link: string): Embed | null {
  const url = lerUrlHttps(link);
  if (!url || url.hostname !== "drive.google.com") return null;

  let id: string | null = null;
  const partes = url.pathname.split("/").filter(Boolean);
  if (partes[0] === "file" && partes[1] === "d") {
    id = partes[2] ?? null;
  } else if (
    partes.length === 1 &&
    (partes[0] === "open" || partes[0] === "uc")
  ) {
    id = url.searchParams.get("id");
  }

  if (!id || !ID_DRIVE.test(id)) return null;
  return {
    tipo: "drive",
    id,
    abrir: `https://drive.google.com/file/d/${id}/view`,
    baixar: `https://drive.google.com/uc?export=download&id=${id}`,
  };
}

const CAMINHO_FORMS =
  /^\/forms\/d\/(e\/)?([A-Za-z0-9_-]+)(?:\/(?:viewform|edit))?\/?$/;
const CAMINHO_FORMS_GLE = /^\/[A-Za-z0-9_-]+\/?$/;

// Troca o marcador pelo código do aluno (quando informado), normaliza para
// /viewform e tira o embedded. Links forms.gle abrem como estão, sem
// preenchimento.
export function lerForms(link: string, codigo?: string): Embed | null {
  const url = lerUrlHttps(link);
  if (!url) return null;

  if (url.hostname === "forms.gle") {
    if (!CAMINHO_FORMS_GLE.test(url.pathname)) return null;
    return { tipo: "forms", url: url.href };
  }

  if (url.hostname !== "docs.google.com") return null;
  const caminho = CAMINHO_FORMS.exec(url.pathname);
  if (!caminho) return null;

  const destino = new URL(
    `https://docs.google.com/forms/d/${caminho[1] ?? ""}${caminho[2]}/viewform`,
  );
  for (const [campo, valor] of url.searchParams) {
    if (campo === "embedded") continue;
    destino.searchParams.append(
      campo,
      codigo === undefined
        ? valor
        : valor
            .replaceAll(MARCADOR_CODIGO, codigo)
            .replaceAll(MARCADOR_ANTIGO, codigo),
    );
  }
  return { tipo: "forms", url: destino.href };
}

// Arquivo público do Supabase Storage do próprio projeto. A origem vem do
// NEXT_PUBLIC_SUPABASE_URL (no computador é http, no ar é https).
const CAMINHO_DO_STORAGE = "/storage/v1/object/public/";

function ehDoStorage(
  link: string,
  supabaseUrl: string | undefined,
): URL | null {
  if (!supabaseUrl) return null;
  let url: URL;
  let supabase: URL;
  try {
    url = new URL(link.trim());
    supabase = new URL(supabaseUrl);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  if (url.origin !== supabase.origin) return null;
  return url.pathname.startsWith(CAMINHO_DO_STORAGE) ? url : null;
}

// Áudio do Drive abre em nova guia; arquivo do Supabase Storage toca no
// tocador da aula. Link de outro servidor é recusado: o navegador do aluno
// (inclusive menores) não acessa servidores de terceiros, que veriam o IP.
// A CSP reforça com o media-src (ver lib/seguranca.ts).
export function lerAudio(
  link: string,
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
): Embed | null {
  const drive = lerDrive(link);
  if (drive) return drive;
  const url = ehDoStorage(link, supabaseUrl);
  return url ? { tipo: "audio", src: url.href } : null;
}

export function lerLink(link: string): Embed | null {
  const url = lerUrlHttps(link);
  return url ? { tipo: "link", url: url.href } : null;
}

// Lê o link conforme o tipo do bloco; null quando o link não serve.
export function lerConteudo(
  tipo: TipoDeBloco,
  link: string,
  codigo?: string,
): Embed | null {
  switch (tipo) {
    case "youtube":
      return lerYoutube(link);
    case "drive":
      return lerDrive(link);
    case "audio":
      return lerAudio(link);
    case "link":
      return lerLink(link);
    case "prova":
      return lerForms(link, codigo);
    case "texto":
      return null;
  }
}
