import { ehUuid } from "../cursos/validacao";

export type DadosAviso = {
  titulo: string;
  texto: string;
  curso_id: string | null;
};

type Resultado =
  | { ok: true; dados: DadosAviso }
  | { ok: false; erro: string; valores: Record<string, string> };

function texto(formData: FormData, campo: string): string {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

// curso_id vazio significa aviso para todos os alunos.
export function validarAviso(formData: FormData): Resultado {
  const valores = {
    titulo: texto(formData, "titulo"),
    texto: texto(formData, "texto"),
    curso_id: texto(formData, "curso_id"),
  };
  const falha = (erro: string) => ({ ok: false as const, erro, valores });

  if (!valores.titulo) return falha("Informe o título do aviso.");
  if (valores.titulo.length > 120)
    return falha("O título pode ter no máximo 120 caracteres.");
  if (!valores.texto) return falha("Escreva o texto do aviso.");
  if (valores.texto.length > 2000)
    return falha("O texto pode ter no máximo 2000 caracteres.");
  if (valores.curso_id && !ehUuid(valores.curso_id))
    return falha("Escolha um curso da lista.");

  return {
    ok: true,
    dados: {
      titulo: valores.titulo,
      texto: valores.texto,
      curso_id: valores.curso_id || null,
    },
  };
}
