"use client";

import { useActionState } from "react";
import { reenviarConvite } from "./acoes";

export function BotaoReenviar({ alunoId }: { alunoId: string }) {
  const [estado, enviar, enviando] = useActionState(
    reenviarConvite.bind(null, alunoId),
    {},
  );

  return (
    <form action={enviar} className="space-y-2">
      <button
        type="submit"
        disabled={enviando}
        className="inline-flex min-h-12 items-center justify-center rounded-xl border border-linha bg-superficie px-5 py-3 font-bold text-texto hover:border-borda-campo disabled:opacity-60"
      >
        {enviando ? "Reenviando…" : "Reenviar convite"}
      </button>
      {estado.erro && (
        <p
          role="alert"
          className="rounded-xl bg-bloco p-4 text-sm text-texto-sobre-bloco"
        >
          {estado.erro}
        </p>
      )}
      {estado.sucesso && (
        <p
          role="status"
          className="rounded-xl bg-linha p-4 text-sm text-sucesso"
        >
          {estado.sucesso}
        </p>
      )}
    </form>
  );
}
