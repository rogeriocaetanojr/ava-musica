import {
  type AulaDoCurso,
  type ModuloDoCurso,
  resumoDoCurso,
} from "@/lib/progresso";

export type AulaComProvas = AulaDoCurso & {
  conteudos: { id: string; tipo: string }[];
};

export type RegistroDeProgresso = {
  aula_id: string;
  conteudo_id: string | null;
  concluido_em: string;
};

// Ids das aulas concluídas e das provas marcadas como enviadas.
export function separarProgresso(registros: readonly RegistroDeProgresso[]) {
  const aulas = new Set<string>();
  const provas = new Set<string>();
  for (const r of registros) {
    if (r.conteudo_id) provas.add(r.conteudo_id);
    else aulas.add(r.aula_id);
  }
  return { aulas, provas };
}

// Resumo de um curso para o painel do professor: o progresso de aulas (mesma
// regra da tela do aluno) e quantas provas das aulas publicadas foram enviadas.
export function resumoParaProfessor(
  modulos: readonly ModuloDoCurso<AulaComProvas>[],
  registros: readonly RegistroDeProgresso[],
) {
  const { aulas, provas } = separarProgresso(registros);
  const resumo = resumoDoCurso(modulos, aulas);
  const idsDasProvas = modulos
    .flatMap((m) => m.aulas)
    .filter((a) => a.publicada)
    .flatMap((a) => a.conteudos)
    .filter((c) => c.tipo === "prova")
    .map((c) => c.id);
  return {
    total: resumo.total,
    concluidas: resumo.concluidas,
    percentual: resumo.percentual,
    provas: idsDasProvas.length,
    provasEnviadas: idsDasProvas.filter((id) => provas.has(id)).length,
  };
}

// Data do registro mais recente; nula quando o aluno ainda não fez nada.
export function ultimaAtividade(
  registros: readonly RegistroDeProgresso[],
): string | null {
  let ultima: string | null = null;
  for (const r of registros)
    if (ultima === null || Date.parse(r.concluido_em) > Date.parse(ultima))
      ultima = r.concluido_em;
  return ultima;
}
