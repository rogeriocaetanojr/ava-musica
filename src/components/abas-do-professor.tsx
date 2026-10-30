import Link from "next/link";
import type { ReactNode } from "react";
import type { SecaoDoProfessor } from "@/components/cabecalho-do-professor";

const tracos = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

// O nome completo vale para leitores de tela e começa pelo texto visível.
const ABAS: {
  secao: SecaoDoProfessor;
  rotulo: string;
  nomeCompleto?: string;
  href: string;
  icone: ReactNode;
}[] = [
  {
    secao: "painel",
    rotulo: "Painel",
    href: "/professor",
    icone: (
      <>
        <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
        <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
        <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
        <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />
      </>
    ),
  },
  {
    secao: "cursos",
    rotulo: "Cursos",
    nomeCompleto: "Cursos e aulas",
    href: "/professor/cursos",
    icone: (
      <>
        <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" />
        <path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3" />
      </>
    ),
  },
  {
    secao: "alunos",
    rotulo: "Alunos",
    href: "/professor/alunos",
    icone: (
      <>
        <circle cx="10" cy="8" r="3.5" />
        <path d="M3.5 20a6.5 6.5 0 0 1 13 0" />
        <path d="M16 4.8a3.5 3.5 0 0 1 0 6.4" />
        <path d="M18.5 14.5a6.5 6.5 0 0 1 2 5.5" />
      </>
    ),
  },
  {
    secao: "recados",
    rotulo: "Recados",
    href: "/professor/avisos",
    icone: (
      <>
        <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </>
    ),
  },
];

// Altura da barra mais a área segura do iPhone, reservada no fim da página
// para o conteúdo não ficar escondido atrás dela.
const altura = "h-[calc(5rem+env(safe-area-inset-bottom))]";

// Barra de abas fixa no rodapé da área do professor, só no celular.
export function AbasDoProfessor({ atual }: { atual: SecaoDoProfessor }) {
  return (
    <>
      <div aria-hidden="true" className={`${altura} shrink-0 md:hidden`} />
      <nav
        aria-label="Abas da área do professor"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-linha bg-superficie pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid grid-cols-4 gap-1 px-2 py-2">
          {ABAS.map(({ secao, rotulo, nomeCompleto, href, icone }) => (
            <li key={secao}>
              <Link
                href={href}
                aria-label={nomeCompleto}
                aria-current={secao === atual ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl text-sm font-bold ${
                  secao === atual
                    ? "bg-bloco text-aba-atual"
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
