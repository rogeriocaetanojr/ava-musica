export const NIVEIS = ["Iniciante", "Intermediário", "Avançado"] as const;

// Estado devolvido pelas ações aos formulários; valores guarda o que foi
// digitado, para não se perder quando há erro.
export type EstadoFormulario = {
  erro?: string;
  sucesso?: string;
  valores?: Record<string, string>;
};

export type DadosCurso = {
  titulo: string;
  instrumento: string;
  nivel: string | null;
  descricao: string | null;
  capa_url: string | null;
  publicado: boolean;
};

type Resultado<T> =
  | { ok: true; dados: T }
  | { ok: false; erro: string; valores: Record<string, string> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ehUuid(valor: unknown): valor is string {
  return typeof valor === "string" && UUID.test(valor);
}

function texto(formData: FormData, campo: string): string {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

// Campos de texto do formulário, para devolvê-los à tela quando o banco recusa.
export function valoresDigitados(formData: FormData): Record<string, string> {
  const valores: Record<string, string> = {};
  formData.forEach((valor, campo) => {
    if (typeof valor === "string" && !campo.startsWith("$ACTION"))
      valores[campo] = valor;
  });
  return valores;
}

function urlValida(valor: string): boolean {
  try {
    const url = new URL(valor);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function validarCurso(formData: FormData): Resultado<DadosCurso> {
  const valores = {
    titulo: texto(formData, "titulo"),
    instrumento: texto(formData, "instrumento"),
    nivel: texto(formData, "nivel"),
    descricao: texto(formData, "descricao"),
    capa_url: texto(formData, "capa_url"),
    publicado: formData.get("publicado") === "on" ? "on" : "",
  };
  const falha = (erro: string) => ({ ok: false as const, erro, valores });

  if (!valores.titulo) return falha("Informe o título do curso.");
  if (valores.titulo.length > 120)
    return falha("O título pode ter no máximo 120 caracteres.");
  if (!valores.instrumento) return falha("Informe o instrumento.");
  if (valores.instrumento.length > 60)
    return falha("O instrumento pode ter no máximo 60 caracteres.");
  if (valores.nivel && !(NIVEIS as readonly string[]).includes(valores.nivel))
    return falha("Escolha um nível da lista.");
  if (valores.descricao.length > 2000)
    return falha("A descrição pode ter no máximo 2000 caracteres.");
  if (valores.capa_url && !urlValida(valores.capa_url))
    return falha(
      "O endereço da capa precisa ser um link completo, começando com https://.",
    );

  return {
    ok: true,
    dados: {
      titulo: valores.titulo,
      instrumento: valores.instrumento,
      nivel: valores.nivel || null,
      descricao: valores.descricao || null,
      capa_url: valores.capa_url || null,
      publicado: valores.publicado === "on",
    },
  };
}

// Título de módulo ou de aula; "o que" entra na mensagem de erro.
export function validarTitulo(
  formData: FormData,
  oQue: "do módulo" | "da aula",
): Resultado<string> {
  const titulo = texto(formData, "titulo");
  const valores = { titulo };
  if (!titulo) return { ok: false, erro: `Informe o título ${oQue}.`, valores };
  if (titulo.length > 120)
    return {
      ok: false,
      erro: "O título pode ter no máximo 120 caracteres.",
      valores,
    };
  return { ok: true, dados: titulo };
}
