import Link from "next/link";
import { BarraProgresso } from "@/components/barra-progresso";
import { Cordas } from "@/components/cordas";
import {
  type AulaDoCurso,
  type ModuloDoCurso,
  resumoDoCurso,
} from "@/lib/progresso";

type Aula = AulaDoCurso & { titulo: string };
type Modulo = ModuloDoCurso<Aula> & { titulo: string };
export type CursoDoAluno = {
  id: string;
  titulo: string;
  instrumento: string;
  nivel: string | null;
  modulos: Modulo[];
};

// Colunas que o card precisa, para a home e o Meu perfil lerem igual.
export const SELECT_DOS_CURSOS =
  "id, titulo, instrumento, nivel, modulos (id, titulo, ordem, aulas (id, titulo, ordem, publicada))";

// Capas alternadas pela ordem da lista; as cordas mudam de cor no amarelo.
const CAPAS = [
  { fundo: "bg-bordo", cordas: "amarelo" },
  { fundo: "bg-amarelo", cordas: "vinho" },
  { fundo: "bg-vinho", cordas: "amarelo" },
] as const;

// Card de curso da home do aluno: a faixa colorida, o título e a barra de
// progresso, abrindo o curso.
export function CartaoDoCurso({
  curso,
  posicao,
  concluidas,
}: {
  curso: CursoDoAluno;
  posicao: number;
  concluidas: Set<string>;
}) {
  const resumo = resumoDoCurso(curso.modulos, concluidas);
  const capa = CAPAS[posicao % CAPAS.length];
  const terminou = resumo.total > 0 && resumo.proxima === null;

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-linha bg-superficie">
      <Link href={`/cursos/${curso.id}`} className="flex flex-1 flex-col">
        <div
          className={`relative h-16 md:h-[9dvh] 2xl:h-[12dvh] ${capa.fundo}`}
        >
          <Cordas
            cor={capa.cordas}
            className="absolute inset-y-0 left-1/3 w-16 md:w-20"
          />
        </div>
        <div className="space-y-3 p-4 md:p-5 2xl:space-y-4 2xl:p-6">
          <h3 className="font-titulo text-lg break-words text-texto md:truncate">
            {curso.titulo}
          </h3>
          <BarraProgresso
            percentual={resumo.percentual}
            rotulo={`Progresso em ${curso.titulo}`}
            cor="bordo"
            comTexto={false}
          />
          <p className="text-sm text-texto-secundario">
            {terminou ? (
              "Concluído"
            ) : (
              <>
                <span className="hidden md:inline">
                  {resumo.concluidas} de {resumo.total}{" "}
                  {resumo.total === 1 ? "aula" : "aulas"} ·{" "}
                </span>
                {resumo.percentual}%
              </>
            )}
          </p>
        </div>
      </Link>
    </li>
  );
}
