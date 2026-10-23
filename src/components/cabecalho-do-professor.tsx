import Link from "next/link";
import { LogoDoAva } from "@/components/logo-do-ava";

import { iniciais } from "@/lib/nomes";

export type SecaoDoProfessor = "painel" | "cursos" | "alunos" | "recados";

const ITENS: { secao: SecaoDoProfessor; rotulo: string; href: string }[] = [
  { secao: "painel", rotulo: "Painel", href: "/professor" },
  { secao: "cursos", rotulo: "Cursos e aulas", href: "/professor/cursos" },
  { secao: "alunos", rotulo: "Alunos", href: "/professor/alunos" },
  { secao: "recados", rotulo: "Recados", href: "/professor/avisos" },
];

const item =
  "inline-flex min-h-12 items-center rounded-xl px-4 text-base font-bold";

// Cabeçalho da área do professor: logo com o selo, navegação, avatar e Sair.
// No celular fica só o logo com o selo; a navegação vai para a barra de abas.
export function CabecalhoDoProfessor({
  nome,
  atual,
}: {
  nome: string;
  atual: SecaoDoProfessor;
}) {
  return (
    <header className="border-b border-linha bg-superficie">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 md:px-8">
        <Link
          href="/professor"
          className="flex min-h-12 flex-1 items-center gap-3 font-titulo text-2xl text-texto md:flex-none"
        >
          <LogoDoAva
            semSubtitulo
            className="[--altura:46px] md:[--altura:60px]"
          />
          <span className="ml-auto rounded-full bg-amarelo-claro px-3 py-1 font-sans text-xs font-bold text-texto-sobre-amarelo md:ml-0">
            Professor
          </span>
        </Link>

        <nav aria-label="Área do professor" className="hidden md:block">
          <ul className="flex flex-wrap gap-2">
            {ITENS.map(({ secao, rotulo, href }) => (
              <li key={secao}>
                <Link
                  href={href}
                  aria-current={secao === atual ? "page" : undefined}
                  className={`${item} ${
                    secao === atual
                      ? "bg-amarelo-claro text-texto-sobre-amarelo"
                      : "text-texto-secundario hover:text-texto"
                  }`}
                >
                  {rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <Link
            href="/cursos"
            className={`${item} text-texto-secundario hover:text-texto`}
          >
            Ver como aluno
          </Link>
          <span
            title={nome}
            className="inline-flex size-12 items-center justify-center rounded-full bg-amarelo text-base font-bold text-texto-sobre-amarelo"
          >
            <span aria-hidden="true">{iniciais(nome)}</span>
            <span className="sr-only">Conectado como {nome}</span>
          </span>
          <form action="/auth/sair" method="post">
            <button
              type="submit"
              className={`${item} text-texto-secundario hover:text-texto`}
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
