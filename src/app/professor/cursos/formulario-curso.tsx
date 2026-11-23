"use client";

import { useActionState } from "react";
import { Botao } from "@/components/botao";
import { Campo, CampoSelect, CampoTexto } from "@/components/campo";
import { type EstadoFormulario, NIVEIS } from "./validacao";

type Props = {
  acao: (
    estado: EstadoFormulario,
    formData: FormData,
  ) => Promise<EstadoFormulario>;
  inicial?: Record<string, string>;
  textoDoBotao: string;
  // Chamado quando a ação salva sem erro (o painel de edição fecha).
  aoSalvar?: () => void;
};

export function FormularioCurso({
  acao,
  inicial = {},
  textoDoBotao,
  aoSalvar,
}: Props) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(
    async (anterior, formData) => {
      const resultado = await acao(anterior, formData);
      if (resultado.sucesso) aoSalvar?.();
      return resultado;
    },
    {},
  );
  const valores = estado.valores ?? inicial;

  return (
    <form action={enviar} className="space-y-4">
      <Campo
        id="titulo"
        rotulo="Título"
        name="titulo"
        required
        maxLength={120}
        defaultValue={valores.titulo}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="instrumento"
          rotulo="Instrumento"
          name="instrumento"
          required
          maxLength={60}
          defaultValue={valores.instrumento}
        />
        <CampoSelect
          id="nivel"
          rotulo="Nível"
          name="nivel"
          defaultValue={valores.nivel ?? ""}
        >
          <option value="">Sem nível</option>
          {NIVEIS.map((nivel) => (
            <option key={nivel} value={nivel}>
              {nivel}
            </option>
          ))}
        </CampoSelect>
      </div>

      <CampoTexto
        id="descricao"
        rotulo="Descrição"
        name="descricao"
        rows={3}
        maxLength={2000}
        defaultValue={valores.descricao}
      />

      <label className="flex min-h-12 items-center gap-3 py-2">
        <input
          type="checkbox"
          name="publicado"
          defaultChecked={valores.publicado === "on"}
          className="size-5"
        />
        Publicado (visível para os alunos matriculados)
      </label>

      <Botao type="submit" disabled={enviando} className="sm:w-auto">
        {enviando ? "Salvando…" : textoDoBotao}
      </Botao>

      {estado.erro && (
        <p
          role="alert"
          className="rounded-xl bg-bloco p-4 text-texto-sobre-bloco"
        >
          {estado.erro}
        </p>
      )}
      {estado.sucesso && (
        <p role="status" className="rounded-xl bg-linha p-4 text-sucesso">
          {estado.sucesso}
        </p>
      )}
    </form>
  );
}
