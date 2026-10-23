import type { HTMLAttributes } from "react";

// Caixa de informação em amarelo claro, com o ícone de exclamação.
export function Aviso({
  children,
  className,
  ...resto
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex gap-3 rounded-xl bg-amarelo-claro p-4 text-sm leading-relaxed text-texto-sobre-amarelo ${className ?? ""}`}
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
        <path d="M10 6v5" strokeLinecap="round" />
        <circle cx="10" cy="14" r="0.6" fill="currentColor" />
      </svg>
      <div>{children}</div>
    </div>
  );
}
