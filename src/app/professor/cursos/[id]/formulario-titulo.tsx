"use client";

import { useActionState } from "react";
import type { EstadoFormulario } from "../validacao";

type Props = {
  acao: (
    estado: EstadoFormulario,
    formData: FormData,
  ) => Promise<EstadoFormulario>;
  rotulo: string;
  textoDoBotao: string;
  inicial?: string;
  classeDoBotao?: string;
};

// Campo único de título, usado para criar e renomear módulos e aulas.
export function FormularioTitulo({
  acao,
  rotulo,
  textoDoBotao,
  inicial = "",
  classeDoBotao = "",
}: Props) {
  const [estado, enviar, enviando] = useActionState(acao, {});

  return (
    <form action={enviar} className="space-y-2">
      <div className="flex gap-2">
        <input
          name="titulo"
          aria-label={rotulo}
          placeholder={rotulo}
          required
          maxLength={120}
          defaultValue={estado.valores?.titulo ?? inicial}
          className="min-h-12 min-w-0 flex-1 rounded-xl border border-borda-campo bg-superficie px-4 py-2 text-texto placeholder:text-texto-secundario"
        />
        <button
          type="submit"
          disabled={enviando}
          className={`min-h-12 shrink-0 rounded-xl bg-bordo px-5 py-2 text-sm font-bold text-superficie hover:bg-vinho disabled:opacity-60 ${classeDoBotao}`}
        >
          {enviando ? "…" : textoDoBotao}
        </button>
      </div>
      {estado.erro && (
        <p
          role="alert"
          className="rounded-xl bg-amarelo-claro p-3 text-sm text-texto-sobre-amarelo"
        >
          {estado.erro}
        </p>
      )}
      {estado.sucesso && (
        <p role="status" className="text-sm text-sucesso">
          {estado.sucesso}
        </p>
      )}
    </form>
  );
}
