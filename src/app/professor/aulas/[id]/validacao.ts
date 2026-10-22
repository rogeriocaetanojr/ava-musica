import { type Bloco } from "@/components/bloco-conteudo";
import { ehTipoDeBloco, lerConteudo, type TipoDeBloco } from "@/lib/embeds";

type Resultado<T> =
  | { ok: true; dados: T }
  | { ok: false; erro: string; valores: Record<string, string> };

export const NOMES_DOS_TIPOS: Record<TipoDeBloco, string> = {
  texto: "Texto",
  youtube: "Vídeo do YouTube",
  drive: "Arquivo do Google Drive",
  audio: "Áudio",
  link: "Link externo",
  prova: "Prova (Google Forms)",
};

const ERROS_DE_LINK: Record<Exclude<TipoDeBloco, "texto">, string> = {
  youtube: "Cole um link de vídeo do YouTube, começando com https://.",
  drive:
    "Cole o link de compartilhamento de um arquivo do Google Drive, começando com https://.",
  audio:
    "Cole um link do Google Drive ou de um arquivo de áudio, começando com https://.",
  link: "O link precisa ser completo e começar com https://.",
  prova:
    "Cole o link de um Google Forms (docs.google.com/forms ou forms.gle), começando com https://.",
};

function texto(formData: FormData, campo: string): string {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

// Valida um bloco de conteúdo. O link é guardado como foi colado; a troca do
// marcador de e-mail e a normalização acontecem na hora de exibir.
export function validarBloco(formData: FormData): Resultado<Bloco> {
  const valores = {
    tipo: texto(formData, "tipo"),
    titulo: texto(formData, "titulo"),
    texto: texto(formData, "texto"),
    url: texto(formData, "url"),
  };
  const falha = (erro: string) => ({ ok: false as const, erro, valores });

  const tipo = valores.tipo;
  if (!ehTipoDeBloco(tipo)) return falha("Escolha um tipo de conteúdo.");
  if (valores.titulo.length > 120)
    return falha("O título pode ter no máximo 120 caracteres.");

  if (tipo === "texto") {
    if (!valores.texto) return falha("Escreva o texto do bloco.");
    if (valores.texto.length > 10000)
      return falha("O texto pode ter no máximo 10000 caracteres.");
    return {
      ok: true,
      dados: {
        tipo,
        titulo: valores.titulo || null,
        texto: valores.texto,
        url: null,
      },
    };
  }

  if (!valores.url) return falha("Cole o link do conteúdo.");
  if (valores.url.length > 2000)
    return falha("O link pode ter no máximo 2000 caracteres.");
  if (!lerConteudo(tipo, valores.url)) return falha(ERROS_DE_LINK[tipo]);

  return {
    ok: true,
    dados: {
      tipo,
      titulo: valores.titulo || null,
      texto: null,
      url: valores.url,
    },
  };
}
