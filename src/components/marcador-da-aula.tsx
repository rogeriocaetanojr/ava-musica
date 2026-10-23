// Círculo que mostra a situação de cada aula nas listas do curso e da lateral
// da aula. É só enfeite: a situação vai em texto para os leitores de tela.

export type Situacao = "concluida" | "atual" | "prova" | "pendente";

export const TEXTO_DA_SITUACAO: Record<Situacao, string> = {
  concluida: "concluída",
  atual: "aula atual",
  prova: "prova",
  pendente: "pendente",
};

const VISTO = "M5 12.5l4.5 4.5L19 7.5";

function Visto({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={VISTO} />
    </svg>
  );
}

export function MarcadorDaAula({
  situacao,
  numero,
}: {
  situacao: Situacao;
  numero: number;
}) {
  const base =
    "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold";
  switch (situacao) {
    case "concluida":
      return (
        <span aria-hidden="true" className={`${base} bg-bordo text-amarelo`}>
          <Visto className="size-4" />
        </span>
      );
    case "atual":
      return (
        <span
          aria-hidden="true"
          className={`${base} bg-amarelo text-texto-sobre-amarelo`}
        >
          {numero}
        </span>
      );
    case "prova":
      return (
        <span
          aria-hidden="true"
          className={`${base} border-2 border-dashed border-borda-campo text-texto-secundario`}
        >
          <Visto className="size-3.5" />
        </span>
      );
    case "pendente":
      return (
        <span
          aria-hidden="true"
          className={`${base} border-2 border-borda-campo text-texto-secundario`}
        >
          {numero}
        </span>
      );
  }
}
