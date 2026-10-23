import Link from "next/link";
import { LogoDoAva } from "@/components/logo-do-ava";

import { iniciais } from "@/lib/nomes";

export type SecaoDoAluno = "cursos" | "avisos" | "perfil";

const ITENS: {
  secao: Exclude<SecaoDoAluno, "perfil">;
  rotulo: string;
  href: string;
}[] = [
  { secao: "cursos", rotulo: "Meus cursos", href: "/cursos" },
  { secao: "avisos", rotulo: "Avisos", href: "/cursos#recados" },
];

const item =
  "inline-flex min-h-12 items-center rounded-xl px-4 text-base font-bold";

function textoDoSino(naoLidos: number): string {
  if (naoLidos === 0) return "Avisos";
  return naoLidos === 1
    ? "Avisos: 1 aviso não lido"
    : `Avisos: ${naoLidos} avisos não lidos`;
}

// Cabeçalho da área do aluno: logo, navegação, sino de avisos e avatar. No
// celular fica só o logo e o sino; a navegação vai para as AbasDoAluno.
export function CabecalhoDoAluno({
  nome,
  atual,
  naoLidos = 0,
}: {
  nome: string;
  atual: SecaoDoAluno;
  naoLidos?: number;
}) {
  return (
    <header className="border-b border-linha bg-superficie">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link
          href="/cursos"
          className="flex min-h-12 items-center gap-3 font-titulo text-2xl text-texto"
        >
          <LogoDoAva
            semSubtitulo
            className="[--altura:46px] md:[--altura:60px]"
          />
        </Link>

        <nav aria-label="Área do aluno" className="hidden md:block">
          <ul className="flex gap-2">
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

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/cursos#recados"
            aria-label={textoDoSino(naoLidos)}
            className="relative inline-flex size-12 items-center justify-center rounded-xl border border-linha bg-superficie text-texto"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
              <path d="M10 20a2 2 0 0 0 4 0" />
            </svg>
            {naoLidos > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-2 right-2 size-2.5 rounded-full bg-amarelo"
              />
            )}
          </Link>

          <span
            title={nome}
            className="hidden size-12 items-center justify-center rounded-full bg-bordo md:inline-flex text-base font-bold text-superficie"
          >
            <span aria-hidden="true">{iniciais(nome)}</span>
            <span className="sr-only">Conectado como {nome}</span>
          </span>

          <form action="/auth/sair" method="post" className="hidden md:block">
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
