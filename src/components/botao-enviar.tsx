"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

// Botão de formulário que fica desativado enquanto a ação roda.
export function BotaoEnviar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className ?? ""} disabled:opacity-60`}
    >
      {pending ? "Salvando…" : children}
    </button>
  );
}
