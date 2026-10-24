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
          className="min-w-0 flex-1 rounded-md border border-current bg-transparent px-3 py-2 md:min-h-12 md:rounded-xl md:border-borda-campo md:bg-superficie md:px-4 md:text-texto md:placeholder:text-texto-secundario"
        />
        <button
          type="submit"
          disabled={enviando}
          className={`shrink-0 rounded-md border border-current px-3 py-2 text-sm font-medium disabled:opacity-60 md:min-h-12 md:rounded-xl md:border-0 md:bg-bordo md:px-5 md:font-bold md:text-superficie md:hover:bg-vinho ${classeDoBotao}`}
        >
          {enviando ? "…" : textoDoBotao}
        </button>
      </div>
      {estado.erro && (
        <p
          role="alert"
          className="rounded-md bg-red-100 p-2 text-sm text-red-800 md:rounded-xl md:bg-amarelo-claro md:p-3 md:text-texto-sobre-amarelo"
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
