"use client";

import { useActionState, useId } from "react";
import { Botao } from "@/components/botao";
import { classesDoCampo } from "@/components/campo";
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
  // Rótulo visível acima do campo e botão no tamanho normal, como nos
  // formulários dos painéis (Novo módulo).
  comRotulo?: boolean;
  // Chamado quando a ação salva sem erro (o painel lateral fecha).
  aoSalvar?: () => void;
};

// Campo único de título, usado para criar e renomear módulos e aulas.
export function FormularioTitulo({
  acao,
  rotulo,
  textoDoBotao,
  inicial = "",
  classeDoBotao = "",
  comRotulo = false,
  aoSalvar,
}: Props) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(
    async (anterior, formData) => {
      const resultado = await acao(anterior, formData);
      if (!resultado.erro) aoSalvar?.();
      return resultado;
    },
    {},
  );
  const id = useId();

  return (
    <form action={enviar} className="space-y-2">
      {comRotulo && (
        <label htmlFor={id} className="block text-sm font-bold text-texto">
          {rotulo}
        </label>
      )}
      <div
        className={comRotulo ? "flex flex-col gap-3 sm:flex-row" : "flex gap-2"}
      >
        <input
          id={comRotulo ? id : undefined}
          name="titulo"
          aria-label={comRotulo ? undefined : rotulo}
          placeholder={comRotulo ? undefined : rotulo}
          required
          maxLength={120}
          defaultValue={estado.valores?.titulo ?? inicial}
          className={classesDoCampo("min-w-0 flex-1")}
        />
        <Botao
          type="submit"
          disabled={enviando}
          tamanho={comRotulo ? "normal" : "pequeno"}
          className={`shrink-0 ${comRotulo ? "sm:w-auto" : ""} ${classeDoBotao}`}
        >
          {enviando ? "…" : textoDoBotao}
        </Botao>
      </div>
      {estado.erro && (
        <p
          role="alert"
          className="rounded-xl bg-bloco p-3 text-sm text-texto-sobre-bloco"
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
