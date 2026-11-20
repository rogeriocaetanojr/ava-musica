import {
  type AulaDoCurso,
  type ModuloDoCurso,
  percentualDeProgresso,
} from "@/lib/progresso";

export type AulaComProvas = AulaDoCurso & {
  conteudos: { id: string; tipo: string }[];
};

export type RegistroDeProgresso = {
  aula_id: string;
  conteudo_id: string | null;
  concluido_em: string;
};

// Contagem do progresso de um aluno num curso, calculada no banco pela função
// progresso_por_curso (migração 20261120000000). O painel não lê mais os
// registros um a um: a API do Supabase devolve no máximo 1000 linhas por
// consulta, e o progresso de todos os alunos passa disso rápido.
export type ContagemDoCurso = {
  aluno_id: string;
  curso_id: string;
  // Só aulas publicadas, como na tela do aluno.
  aulas_concluidas: number;
  // Provas de aulas publicadas marcadas como enviadas.
  provas_enviadas: number;
  // Aula publicada concluída mais recente e quando foi.
  ultima_aula_id: string | null;
  ultima_aula_em: string | null;
  // Aulas concluídas nos últimos 7 dias, publicadas ou não.
  aulas_na_semana: number;
};

// Resumo de um curso para o painel do professor: o progresso de aulas (mesma
// regra da tela do aluno) e quantas provas das aulas publicadas foram enviadas.
// Os totais vêm da estrutura do curso; as quantidades feitas, do banco.
export function resumoParaProfessor(
  modulos: readonly ModuloDoCurso<AulaComProvas>[],
  contagem:
    | Pick<ContagemDoCurso, "aulas_concluidas" | "provas_enviadas">
    | null
    | undefined,
) {
  const publicadas = modulos.flatMap((m) => m.aulas).filter((a) => a.publicada);
  const total = publicadas.length;
  const provas = publicadas
    .flatMap((a) => a.conteudos)
    .filter((c) => c.tipo === "prova").length;
  const concluidas = Math.min(contagem?.aulas_concluidas ?? 0, total);
  return {
    total,
    concluidas,
    percentual: percentualDeProgresso(concluidas, total),
    provas,
    provasEnviadas: Math.min(contagem?.provas_enviadas ?? 0, provas),
  };
}

// Aulas concluídas nos últimos 7 dias, somando todos os cursos.
export function aulasConcluidasNaSemana(
  contagens: readonly Pick<ContagemDoCurso, "aulas_na_semana">[],
): number {
  return contagens.reduce((soma, c) => soma + c.aulas_na_semana, 0);
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

export type SituacaoDoAluno = "ativo" | "aguardando" | "bloqueado";

// O bloqueio vale acima de tudo; depois, o menor de 12 sem aceite do
// responsável.
export function situacaoDoAluno(aluno: {
  menor_de_12: boolean;
  bloqueado_em: string | null;
  aceito_em: string | null;
}): SituacaoDoAluno {
  if (aluno.bloqueado_em) return "bloqueado";
  if (aluno.menor_de_12 && !aluno.aceito_em) return "aguardando";
  return "ativo";
}
