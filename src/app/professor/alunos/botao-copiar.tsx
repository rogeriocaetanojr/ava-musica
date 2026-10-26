"use client";

import { useState } from "react";

// Mostra o link num campo só de leitura (dá para selecionar à mão) e copia
// com um clique.
export function BotaoCopiar({
  texto,
  rotulo,
}: {
  texto: string;
  rotulo: string;
}) {
  const [copiado, setCopiado] = useState(false);

  return (
    <div className="flex gap-2">
      <input
        readOnly
        value={texto}
        aria-label={rotulo}
        onFocus={(e) => e.target.select()}
        className="min-h-12 min-w-0 flex-1 rounded-xl border border-borda-campo bg-superficie px-4 py-2 text-sm text-texto"
      />
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(texto);
            setCopiado(true);
          } catch {
            setCopiado(false);
          }
        }}
        className="inline-flex min-h-12 items-center justify-center shrink-0 rounded-xl border border-linha bg-superficie px-5 py-3 font-bold text-texto hover:border-borda-campo"
      >
        {copiado ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
