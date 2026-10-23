// Enfeites do violão. São só decoração: ficam escondidos dos leitores de tela.

const QUANTIDADE_DE_CORDAS = 6;

// Listras verticais, como as cordas vistas de frente. Amarelas por padrão;
// vinho para aparecer sobre fundo amarelo.
export function Cordas({
  className,
  cor = "amarelo",
}: {
  className?: string;
  cor?: "amarelo" | "vinho";
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none flex justify-between ${className ?? ""}`}
    >
      {Array.from({ length: QUANTIDADE_DE_CORDAS }, (_, indice) => (
        <span
          key={indice}
          className={`h-full w-px ${cor === "vinho" ? "bg-vinho/50" : "bg-amarelo/70"}`}
        />
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
