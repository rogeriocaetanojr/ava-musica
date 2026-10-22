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
};

// Campo único de título, usado para criar e renomear módulos e aulas.
export function FormularioTitulo({
  acao,
  rotulo,
  textoDoBotao,
  inicial = "",
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
          className="min-w-0 flex-1 rounded-md border border-current bg-transparent px-3 py-2"
        />
        <button
          type="submit"
          disabled={enviando}
          className="shrink-0 rounded-md border border-current px-3 py-2 text-sm font-medium disabled:opacity-60"
        >
          {enviando ? "…" : textoDoBotao}
        </button>
      </div>
      {estado.erro && (
        <p
          role="alert"
          className="rounded-md bg-red-100 p-2 text-sm text-red-800"
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
