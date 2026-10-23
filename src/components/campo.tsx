import type { InputHTMLAttributes } from "react";

// Campo de texto com o rótulo sempre visível acima.
export function Campo({
  id,
  rotulo,
  className,
  ...resto
}: InputHTMLAttributes<HTMLInputElement> & { id: string; rotulo: string }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-bold text-texto">
        {rotulo}
      </label>
      <input
        id={id}
        className={`min-h-14 w-full rounded-xl border border-borda-campo bg-superficie px-4 py-3 text-base text-texto placeholder:text-texto-secundario ${className ?? ""}`}
        {...resto}
      />
    </div>
  );
}
