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
        className="rounded-md border border-current px-3 py-2 text-sm disabled:opacity-60"
      >
        {enviando ? "Reenviando…" : "Reenviar convite"}
      </button>
      {estado.erro && (
        <p role="alert" className="rounded-md bg-red-100 p-3 text-red-800">
          {estado.erro}
        </p>
      )}
      {estado.sucesso && (
        <p role="status" className="rounded-md bg-green-100 p-3 text-green-800">
          {estado.sucesso}
        </p>
      )}
    </form>
  );
}
