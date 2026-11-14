import Link from "next/link";
import { CONTEINER } from "@/components/conteiner";
import { LogoDoAva } from "@/components/logo-do-ava";
import { MenuDaConta } from "@/components/menu-da-conta";

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
  "inline-flex min-h-12 items-center whitespace-nowrap rounded-xl px-4 text-base font-bold md:px-2 lg:px-4";

// Avatar que abre o menu da conta, nas cores da área do professor.
function Avatar({
  nome,
  atual,
  id,
}: {
  nome: string;
  atual: boolean;
  id: string;
}) {
  return (
    <MenuDaConta
      nome={nome}
      perfil="/professor/perfil"
      atual={atual}
      id={id}
      cores="bg-amarelo text-texto-sobre-amarelo hover:bg-amarelo-claro"
    />
  );
}

// Cabeçalho da área do professor: logo, navegação e o avatar, que abre o
// menu da conta (perfil, tema e sair). O selo "Professor" só aparece no celular, onde a navegação vai para
// as abas.
export function CabecalhoDoProfessor({
  nome,
  atual,
}: {
  nome?: string;
  atual?: SecaoDoProfessor;
}) {
  return (
    <header className="border-b border-linha bg-superficie">
      <div
        className={`${CONTEINER} flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 py-3 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-x-4 lg:gap-x-6`}
      >
        <Link
          href="/professor"
          className="flex min-h-12 flex-1 items-center gap-3 font-titulo text-2xl text-texto md:flex-none md:justify-self-start"
        >
          <LogoDoAva
            semSubtitulo
            className="[--altura:46px] lg:[--altura:60px]"
          />
          <span className="ml-auto rounded-full bg-bloco px-3 py-1 font-sans text-xs font-bold text-texto-sobre-bloco md:hidden">
            Professor
          </span>
        </Link>

        <div className="flex items-center gap-2 md:hidden">
          {nome && (
            <Avatar
              nome={nome}
              atual={atual === "perfil"}
              id="menu-da-conta-celular"
            />
          )}
        </div>

        <nav aria-label="Área do professor" className="hidden md:block">
          <ul className="flex items-center gap-1 lg:gap-2">
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

        <div className="ml-auto hidden items-center gap-2 md:flex md:justify-self-end">
          <Link
            href="/cursos"
            className={`${item} text-texto-secundario hover:text-texto md:hidden lg:inline-flex`}
          >
            Ver como aluno
          </Link>
          {nome && (
            <Avatar nome={nome} atual={atual === "perfil"} id="menu-da-conta" />
          )}
        </div>
      </div>
    </header>
  );
}
