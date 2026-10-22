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
        className="min-w-0 flex-1 rounded-md border border-current bg-transparent px-3 py-2 text-sm"
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
        className="shrink-0 rounded-md border border-current px-3 py-2 text-sm font-medium"
      >
        {copiado ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
