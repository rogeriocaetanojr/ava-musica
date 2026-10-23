// Enfeites do violão. São só decoração: ficam escondidos dos leitores de tela.

const QUANTIDADE_DE_CORDAS = 6;

// Listras amarelas verticais, como as cordas vistas de frente.
export function Cordas({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none flex justify-between ${className ?? ""}`}
    >
      {Array.from({ length: QUANTIDADE_DE_CORDAS }, (_, indice) => (
        <span key={indice} className="h-full w-px bg-amarelo/70" />
      ))}
    </div>
  );
}

// Boca do violão: círculo vinho com anel amarelo.
export function BocaDoViolao({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none rounded-full border-2 border-amarelo/60 p-3 ${className ?? ""}`}
    >
      <div className="size-full rounded-full border-[14px] border-amarelo bg-vinho" />
    </div>
  );
}
