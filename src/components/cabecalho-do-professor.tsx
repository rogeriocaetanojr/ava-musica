import Link from "next/link";
import { CONTEINER } from "@/components/conteiner";
import { LogoDoAva } from "@/components/logo-do-ava";
import { MenuDaConta, PILULA } from "@/components/menu-da-conta";

export type SecaoDoProfessor =
  "painel" | "cursos" | "alunos" | "recados" | "perfil";

const ITENS: {
  secao: Exclude<SecaoDoProfessor, "perfil">;
  rotulo: string;
  href: string;
}[] = [
  { secao: "painel", rotulo: "Painel", href: "/professor" },
  { secao: "cursos", rotulo: "Cursos e aulas", href: "/professor/cursos" },
  { secao: "alunos", rotulo: "Alunos", href: "/professor/alunos" },
  { secao: "recados", rotulo: "Recados", href: "/professor/avisos" },
];

const item =
  "inline-flex min-h-12 items-center whitespace-nowrap rounded-full px-4 text-base font-bold md:px-3 lg:px-4";

// Cabeçalho da área do professor: o logo solto à esquerda (com o selo
// "Professor" no celular), a navegação numa pílula no centro e, à direita, a
// pílula do avatar, igual à do aluno. No celular a navegação vai para as abas.
export function CabecalhoDoProfessor({
  nome,
  atual,
}: {
  nome?: string;
  atual?: SecaoDoProfessor;
}) {
  return (
    <header>
      <div
        className={`${CONTEINER} flex max-w-6xl items-center justify-between gap-x-4 py-3 md:grid md:grid-cols-[1fr_auto_1fr] lg:gap-x-6`}
      >
        <Link
          href="/professor"
          className="flex min-h-12 items-center gap-3 font-titulo text-2xl text-texto md:justify-self-start"
        >
          <LogoDoAva
            semSubtitulo
            className="[--altura:46px] lg:[--altura:60px]"
          />
          <span className="rounded-full bg-bloco px-3 py-1 font-sans text-xs font-bold text-texto-sobre-bloco md:hidden">
            Professor
          </span>
        </Link>

        <nav aria-label="Área do professor" className="hidden md:block">
          <ul className={PILULA}>
            {ITENS.map(({ secao, rotulo, href }) => (
              <li key={secao}>
                <Link
                  href={href}
                  aria-current={secao === atual ? "page" : undefined}
                  className={`${item} ${
                    secao === atual
                      ? "bg-bloco text-texto-sobre-bloco"
                      : "text-texto-secundario hover:text-texto"
                  }`}
                >
                  {rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {nome && (
          <div className={`${PILULA} md:justify-self-end`}>
            <MenuDaConta
              nome={nome}
              perfil="/professor/perfil"
              atual={atual === "perfil"}
              cores="bg-amarelo text-texto-sobre-amarelo hover:bg-amarelo-claro"
              atalho={{ href: "/cursos", rotulo: "Ver como aluno" }}
            />
          </div>
        )}
      </div>
    </header>
  );
}
