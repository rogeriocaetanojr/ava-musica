import type { HTMLAttributes } from "react";

// Caixa de informação. No tom de alerta (o padrão), amarelo claro com o ícone
// de exclamação; no tom de sucesso, verde claro com o ícone de confirmação.
export function Aviso({
  children,
  className,
  tom = "alerta",
  ...resto
}: HTMLAttributes<HTMLDivElement> & { tom?: "alerta" | "sucesso" }) {
  const cores =
    tom === "sucesso"
      ? "bg-bloco-sucesso text-texto-sobre-bloco-sucesso"
      : "bg-bloco text-texto-sobre-bloco";
  return (
    <div
      className={`flex gap-3 rounded-xl p-4 text-sm leading-relaxed ${cores} ${className ?? ""}`}
      {...resto}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="mt-0.5 size-5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <circle cx="10" cy="10" r="8" />
        {tom === "sucesso" ? (
          <path
            d="M6.5 10.2l2.4 2.4 4.6-4.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <>
            <path d="M10 6v5" strokeLinecap="round" />
            <circle cx="10" cy="14" r="0.6" fill="currentColor" />
          </>
        )}
      </svg>
      <div>{children}</div>
    </div>
  );
}
