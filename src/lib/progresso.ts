import { ordenar } from "@/lib/ordem";

export type AulaDoCurso = { id: string; ordem: number; publicada: boolean };
export type ModuloDoCurso<A extends AulaDoCurso = AulaDoCurso> = {
  id: string;
  ordem: number;
  aulas: A[];
};

// Percentual inteiro de aulas concluídas, de 0 a 100. Arredonda para baixo,
// para os 100% aparecerem só quando todas as aulas estiverem concluídas.
export function percentualDeProgresso(
  concluidas: number,
  total: number,
): number {
  if (total <= 0 || concluidas <= 0) return 0;
  return Math.min(100, Math.floor((concluidas * 100) / total));
}

// Aulas publicadas do curso na ordem de estudo: módulo por módulo, aula por aula.
export function aulasEmOrdem<A extends AulaDoCurso>(
  modulos: readonly ModuloDoCurso<A>[],
): A[] {
  return ordenar(modulos).flatMap((modulo) =>
    ordenar(modulo.aulas.filter((aula) => aula.publicada)),
  );
}

// Primeira aula ainda não concluída; nula quando todas já foram.
export function proximaAula<A extends { id: string }>(
  aulas: readonly A[],
  concluidas: ReadonlySet<string>,
): A | null {
  return aulas.find((aula) => !concluidas.has(aula.id)) ?? null;
}

// Resumo do curso: quantas aulas concluídas (só as publicadas contam),
// o percentual e a próxima aula.
export function resumoDoCurso<A extends AulaDoCurso>(
  modulos: readonly ModuloDoCurso<A>[],
  concluidas: ReadonlySet<string>,
) {
  const aulas = aulasEmOrdem(modulos);
  const feitas = aulas.filter((aula) => concluidas.has(aula.id)).length;
  return {
    total: aulas.length,
    concluidas: feitas,
    percentual: percentualDeProgresso(feitas, aulas.length),
    proxima: proximaAula(aulas, concluidas),
  };
}
