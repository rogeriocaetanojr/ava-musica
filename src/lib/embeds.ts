// Leitura dos links colados pelo professor: descobre o serviço e monta o
// endereço seguro para incorporar na aula. Funções puras, usadas no servidor
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

// Texto que o professor coloca no link pré-preenchido do Forms.
export const MARCADOR_EMAIL = "EMAIL_DO_ALUNO";

export type Embed =
  | { tipo: "youtube"; id: string; src: string }
  | { tipo: "drive"; id: string; src: string; baixar: string }
  | { tipo: "forms"; src: string }
  | { tipo: "forms-botao"; url: string }
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
    src: `https://drive.google.com/file/d/${id}/preview`,
    baixar: `https://drive.google.com/uc?export=download&id=${id}`,
  };
}

const CAMINHO_FORMS =
  /^\/forms\/d\/(e\/)?([A-Za-z0-9_-]+)(?:\/(?:viewform|edit))?\/?$/;
const CAMINHO_FORMS_GLE = /^\/[A-Za-z0-9_-]+\/?$/;

// Troca o marcador pelo e-mail do aluno (quando informado), normaliza para
// /viewform e liga embedded=true. Links forms.gle não incorporam: viram botão.
export function lerForms(link: string, email?: string): Embed | null {
  const url = lerUrlHttps(link);
  if (!url) return null;

  if (url.hostname === "forms.gle") {
    if (!CAMINHO_FORMS_GLE.test(url.pathname)) return null;
    return { tipo: "forms-botao", url: url.href };
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
      email === undefined ? valor : valor.replaceAll(MARCADOR_EMAIL, email),
    );
  }
  destino.searchParams.set("embedded", "true");
  return { tipo: "forms", src: destino.href };
}

// Áudio do Drive usa o visualizador do Drive; outro link https vai direto
// para o player do navegador.
export function lerAudio(link: string): Embed | null {
  const drive = lerDrive(link);
  if (drive) return drive;
  const url = lerUrlHttps(link);
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
  email?: string,
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
      return lerForms(link, email);
    case "texto":
      return null;
  }
}
