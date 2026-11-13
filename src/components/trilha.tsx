import Link from "next/link";

// Trilha das telas internas (aluno e professor): curso / módulo / aula no
// computador; no celular, o curso numa linha e módulo · aula na seguinte.
export function Trilha({
  curso,
  hrefDoCurso,
  modulo,
  aula,
}: {
  curso: string;
  hrefDoCurso: string;
  modulo: string;
  aula: string;
}) {
  return (
    <nav aria-label="Trilha da aula" className="min-w-0 flex-1">
      <div className="md:hidden">
        <p className="text-base font-bold break-words text-destaque">{curso}</p>
        <p className="text-sm break-words text-texto-secundario">
          {modulo} · {aula}
        </p>
      </div>
      <ol className="hidden flex-wrap items-center gap-x-2 text-base md:flex">
        <li>
          <Link
            href={hrefDoCurso}
            className="inline-flex min-h-12 items-center font-semibold break-words text-destaque underline"
          >
            {curso}
          </Link>
        </li>
        <li aria-hidden="true" className="text-texto-secundario">
          /
        </li>
        <li className="break-words text-texto-secundario">{modulo}</li>
        <li aria-hidden="true" className="text-texto-secundario">
          /
        </li>
        <li aria-current="page" className="font-bold break-words">
          {aula}
        </li>
      </ol>
    </nav>
  );
}
