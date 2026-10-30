"use client";

import { useActionState } from "react";
import { Botao } from "@/components/botao";
import { Campo } from "@/components/campo";
import type { EstadoFormulario } from "../../cursos/validacao";

type Props = {
  acao: (
    estado: EstadoFormulario,
    formData: FormData,
  ) => Promise<EstadoFormulario>;
  titulo: string;
};

// Dados da aula: por enquanto, só o título.
export function FormularioDados({ acao, titulo }: Props) {
  const [estado, enviar, enviando] = useActionState(acao, {});

  return (
    <form action={enviar} className="space-y-4">
      <Campo
        id="titulo-da-aula"
        rotulo="Título da aula"
        name="titulo"
        required
        maxLength={120}
        defaultValue={estado.valores?.titulo ?? titulo}
      />
      <Botao type="submit" disabled={enviando} className="md:w-auto">
        {enviando ? "Salvando…" : "Salvar"}
      </Botao>
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
