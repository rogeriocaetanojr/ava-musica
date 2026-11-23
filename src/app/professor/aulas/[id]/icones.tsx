import type { TipoDeBloco } from "@/lib/embeds";

// Ícone de cada tipo de bloco, no traço dos materiais da aula do aluno.
export const ICONES: Record<TipoDeBloco, string> = {
  texto: "M5 6h14M5 10h14M5 14h10M5 18h7",
  youtube: "M3 6h18v12H3zM10 9l5 3-5 3z",
  drive: "M14 3H6v18h12V7zM14 3v4h4",
  audio:
    "M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  link: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  prova: "M4 4h16v16H4zM8 12l3 3 5-6",
};

export function Icone({
  d,
  classe = "size-5",
}: {
  d: string;
  classe?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={classe}
    >
      <path d={d} />
    </svg>
  );
}

export function IconeDoTipo({
  tipo,
  classe = "size-10",
}: {
  tipo: TipoDeBloco;
  classe?: string;
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-xl bg-bloco text-destaque ${classe}`}
    >
      <Icone d={ICONES[tipo]} />
    </span>
  );
}
