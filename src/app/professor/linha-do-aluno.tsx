import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { BarraProgresso } from "@/components/barra-progresso";

// Linha do aluno no Progresso por curso, usada no card e no painel "Ver
// mais": avatar, nome, barra fina, "X de Y aulas" e a última aula.

export type AlunoDaColuna = {
  id: string;
  nome: string;
  foto: string | null;
  percentual: number;
  // Aulas publicadas concluídas e o total do curso ("X de Y aulas").
  concluidas: number;
  total: number;
  // Título da última aula concluída; nulo sem atividade.
  parouEm: string | null;
  parado: boolean;
  // Última aula concluída no curso (ISO); nula sem atividade.
  ultimaAtividade: string | null;
  // Tempo relativo já pronto no servidor ("há 2 h", "ontem"),
  // para não variar entre o servidor e o navegador.
  quando: string;
};

const AVATAR_NEUTRO = "bg-linha text-texto-secundario";

// Mais recente primeiro; sem data vai para o fim.
export function porRecente(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return Date.parse(b) - Date.parse(a);
}

// Alunos pela atividade mais recente; quem nunca fez nada vai para o fim.
export function ordenarAlunos(alunos: AlunoDaColuna[]) {
  return [...alunos].sort(
    (x, y) =>
      porRecente(x.ultimaAtividade, y.ultimaAtividade) ||
      x.nome.localeCompare(y.nome, "pt-BR"),
  );
}

export function LinhaDoAluno({
  aluno,
  curso,
}: {
  aluno: AlunoDaColuna;
  curso: string;
}) {
  const completo = aluno.total > 0 && aluno.concluidas >= aluno.total;
  const ultimaLinha = aluno.ultimaAtividade
    ? `${completo ? "Última aula" : "Parou em"}: ${aluno.parouEm ?? "aula removida"} · ${aluno.quando}`
    : "Ainda não começou";
  return (
    <li>
      <Link
        href={`/professor/alunos/${aluno.id}`}
        className="flex min-h-12 items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-fundo"
      >
        <Avatar foto={aluno.foto} className={`size-7 ${AVATAR_NEUTRO}`} />
        <span className="min-w-0 flex-1 space-y-1">
          <span className="flex items-center gap-2">
            <span
              className="min-w-0 flex-1 truncate text-sm font-medium text-texto"
              title={aluno.nome}
            >
              {aluno.nome}
            </span>
            {aluno.parado && (
              <span className="shrink-0 rounded-full bg-selo-vermelho px-2 py-0.5 text-[0.7rem] font-bold text-sobre-selo-vermelho">
                Parado
              </span>
            )}
          </span>
          <span className="flex items-center gap-2">
            <span className="flex-1">
              <BarraProgresso
                percentual={aluno.percentual}
                rotulo={`Progresso de ${aluno.nome} em ${curso}`}
                cor="bordo"
                comTexto={false}
                fina
              />
            </span>
            <span
              className={`w-24 shrink-0 text-right text-xs ${completo ? "font-bold text-sucesso" : "text-texto"}`}
            >
              {completo
                ? "Concluiu"
                : `${aluno.concluidas} de ${aluno.total} ${aluno.total === 1 ? "aula" : "aulas"}`}
            </span>
          </span>
          <span
            className="block truncate text-[0.7rem] text-texto-secundario"
            title={ultimaLinha}
          >
            {ultimaLinha}
          </span>
        </span>
      </Link>
    </li>
  );
}
