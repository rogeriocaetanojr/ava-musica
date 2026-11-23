import { CarrosselDeCursos } from "./carrossel-de-cursos";
import {
  type AlunoDaColuna,
  LinhaDoAluno,
  ordenarAlunos,
  porRecente,
} from "./linha-do-aluno";
import { VerMaisAlunos } from "./ver-mais-alunos";

export type { AlunoDaColuna };

export type ColunaDoCurso = {
  id: string;
  titulo: string;
  alunos: AlunoDaColuna[];
  // Média do progresso da turma no curso; nula sem alunos.
  media: number | null;
  // Atividade mais recente de algum aluno no curso; nula sem nenhuma.
  ultimaAtividade: string | null;
};

// Cada card mostra no máximo isto; o resto fica no painel "Ver mais".
export const ALUNOS_POR_COLUNA = 3;

// Cursos com atividade (a mais recente primeiro), depois os sem atividade e,
// por último, os sem alunos.
function ordenarCursos(colunas: ColunaDoCurso[]) {
  const grupo = (c: ColunaDoCurso) =>
    c.alunos.length === 0 ? 2 : c.ultimaAtividade === null ? 1 : 0;
  return [...colunas].sort(
    (a, b) =>
      grupo(a) - grupo(b) ||
      porRecente(a.ultimaAtividade, b.ultimaAtividade) ||
      a.titulo.localeCompare(b.titulo, "pt-BR"),
  );
}

function Coluna({ coluna }: { coluna: ColunaDoCurso }) {
  const total = coluna.alunos.length;
  const cabecalho = (
    <header className="space-y-1">
      <h3
        id={`titulo-coluna-${coluna.id}`}
        className="truncate font-titulo text-lg text-texto"
        title={coluna.titulo}
      >
        {coluna.titulo}
      </h3>
      <p className="text-xs text-texto-secundario">
        {total === 1 ? "1 aluno" : `${total} alunos`}
        {coluna.media !== null && ` · média de ${coluna.media}%`}
      </p>
    </header>
  );

  // Todos os cards têm a mesma altura (self-stretch). Sem alunos, o aviso
  // fica centralizado no espaço que sobra.
  if (total === 0)
    return (
      <section
        aria-labelledby={`titulo-coluna-${coluna.id}`}
        className="flex min-w-0 flex-col gap-3 self-stretch rounded-3xl border border-linha bg-superficie p-4"
      >
        {cabecalho}
        <p className="flex flex-1 items-center justify-center py-4 text-center text-sm text-texto-secundario/70">
          Nenhum aluno matriculado
        </p>
      </section>
    );

  // Os 3 de atividade mais recente; o resto, no painel "Ver mais".
  const ordenados = ordenarAlunos(coluna.alunos);
  const restantes = total - ALUNOS_POR_COLUNA;
  return (
    <section
      aria-labelledby={`titulo-coluna-${coluna.id}`}
      className="flex min-w-0 flex-col gap-2 self-stretch rounded-3xl border border-linha bg-superficie p-4"
    >
      {cabecalho}
      <ul className="space-y-0.5">
        {ordenados.slice(0, ALUNOS_POR_COLUNA).map((aluno) => (
          <LinhaDoAluno key={aluno.id} aluno={aluno} curso={coluna.titulo} />
        ))}
      </ul>
      {restantes > 0 && (
        <div className="-mt-1 -mb-2 flex justify-end">
          <VerMaisAlunos
            curso={coluna.titulo}
            alunos={ordenados}
            restantes={restantes}
          />
        </div>
      )}
    </section>
  );
}

// Progresso por curso: uma coluna por curso publicado, 2 por vez no
// computador e 1 no celular, com rolagem lateral, setas e pontinhos
// (CarrosselDeCursos), sempre pela atividade mais recente.
export function ColunasPorCurso({ colunas }: { colunas: ColunaDoCurso[] }) {
  const ordenadas = ordenarCursos(colunas);
  const titulo = (
    <h2 id="progresso-por-curso" className="font-titulo text-2xl text-texto">
      Progresso por curso
    </h2>
  );

  return (
    <section aria-labelledby="progresso-por-curso" className="space-y-3">
      {ordenadas.length === 0 ? (
        <>
          {titulo}
          <p className="text-texto-secundario">Nenhum curso publicado ainda.</p>
        </>
      ) : (
        <CarrosselDeCursos titulo={titulo}>
          {ordenadas.map((coluna) => (
            <Coluna key={coluna.id} coluna={coluna} />
          ))}
        </CarrosselDeCursos>
      )}
    </section>
  );
}
