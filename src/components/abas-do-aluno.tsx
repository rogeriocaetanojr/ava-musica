import Link from "next/link";
import type { ReactNode } from "react";
import type { SecaoDoAluno } from "@/components/cabecalho-do-aluno";

const tracos = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const ABAS: {
  secao: SecaoDoAluno;
  rotulo: string;
  href: string;
  icone: ReactNode;
}[] = [
  {
    secao: "cursos",
    rotulo: "Cursos",
    href: "/cursos",
    icone: (
      <>
        <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" />
        <path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3" />
      </>
    ),
  },
  {
    secao: "avisos",
    rotulo: "Avisos",
    href: "/cursos#recados",
    icone: (
      <>
        <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </>
    ),
  },
  {
    secao: "perfil",
    rotulo: "Perfil",
    href: "/perfil",
    icone: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
  },
];

// Altura da barra mais a área segura do iPhone, reservada no fim da página
// para o conteúdo não ficar escondido atrás dela.
const altura = "h-[calc(5rem+env(safe-area-inset-bottom))]";

// Barra de abas fixa no rodapé da área do aluno, só no celular.
export function AbasDoAluno({ atual }: { atual: SecaoDoAluno }) {
  return (
    <>
      <div aria-hidden="true" className={`${altura} shrink-0 md:hidden`} />
      <nav
        aria-label="Abas da área do aluno"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-linha bg-superficie pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid grid-cols-3 gap-2 px-3 py-2">
          {ABAS.map(({ secao, rotulo, href, icone }) => (
            <li key={secao}>
              <Link
                href={href}
                aria-current={secao === atual ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl text-sm font-bold ${
                  secao === atual
                    ? "bg-amarelo-claro text-texto-sobre-amarelo"
                    : "text-texto-secundario"
                }`}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6">
                  <g {...tracos}>{icone}</g>
                </svg>
                {rotulo}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
