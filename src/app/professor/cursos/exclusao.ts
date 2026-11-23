// Texto da confirmação de exclusão de curso, módulo ou aula: diz o que vai
// junto, com os números lidos do banco (função resumo_da_exclusao).

export type TipoExcluido = "curso" | "modulo" | "aula";

export type ResumoDaExclusao = {
  tipo: TipoExcluido;
  id: string;
  modulos: number;
  aulas: number;
  conteudos: number;
  alunos_com_progresso: number;
  matriculas: number;
  avisos: number;
};

function contar(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

function juntar(partes: string[]): string {
  if (partes.length <= 1) return partes.join("");
  return `${partes.slice(0, -1).join(", ")} e ${partes.at(-1)}`;
}

const NOMES: Record<TipoExcluido, string> = {
  curso: "o curso",
  modulo: "o módulo",
  aula: "a aula",
};

export function textoDaExclusao(
  tipo: TipoExcluido,
  titulo: string,
  resumo: ResumoDaExclusao | undefined,
): string {
  // Sem o resumo (a leitura falhou), avisa sem números.
  if (!resumo)
    return `Excluir ${NOMES[tipo]} "${titulo}"? Vai junto tudo o que estiver dentro, inclusive o progresso dos alunos. Isso não pode ser desfeito.`;
  const r = resumo;
  const partes: string[] = [];
  if (tipo === "curso" && r.modulos > 0)
    partes.push(contar(r.modulos, "módulo", "módulos"));
  if (tipo !== "aula" && r.aulas > 0)
    partes.push(contar(r.aulas, "aula", "aulas"));
  if (r.conteudos > 0)
    partes.push(contar(r.conteudos, "bloco de conteúdo", "blocos de conteúdo"));
  if (r.alunos_com_progresso > 0)
    partes.push(
      `o progresso de ${contar(r.alunos_com_progresso, "aluno", "alunos")}`,
    );
  if (tipo === "curso" && r.matriculas > 0)
    partes.push(contar(r.matriculas, "matrícula", "matrículas"));
  if (tipo === "curso" && r.avisos > 0)
    partes.push(contar(r.avisos, "recado do curso", "recados do curso"));

  const junto =
    partes.length > 0
      ? ` Vão junto: ${juntar(partes)}.`
      : " Não há mais nada dentro.";
  return `Excluir ${NOMES[tipo]} "${titulo}"?${junto} Isso não pode ser desfeito.`;
}
