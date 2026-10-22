"use client";

import { useActionState } from "react";
import { type EstadoFormulario, NIVEIS } from "./validacao";

type Props = {
  acao: (
    estado: EstadoFormulario,
    formData: FormData,
  ) => Promise<EstadoFormulario>;
  inicial?: Record<string, string>;
  textoDoBotao: string;
};

const campo =
  "w-full rounded-md border border-current bg-transparent px-3 py-3";

export function FormularioCurso({ acao, inicial = {}, textoDoBotao }: Props) {
  const [estado, enviar, enviando] = useActionState(acao, {});
  const valores = estado.valores ?? inicial;

  return (
    <form action={enviar} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="titulo" className="block text-sm font-medium">
          Título
        </label>
        <input
          id="titulo"
          name="titulo"
          required
          maxLength={120}
          defaultValue={valores.titulo}
          className={campo}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="instrumento" className="block text-sm font-medium">
            Instrumento
          </label>
          <input
            id="instrumento"
            name="instrumento"
            required
            maxLength={60}
            defaultValue={valores.instrumento}
            className={campo}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="nivel" className="block text-sm font-medium">
            Nível
          </label>
          <select
            id="nivel"
            name="nivel"
            defaultValue={valores.nivel ?? ""}
            className={campo}
          >
            <option value="">Sem nível</option>
            {NIVEIS.map((nivel) => (
              <option key={nivel} value={nivel}>
                {nivel}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="descricao" className="block text-sm font-medium">
          Descrição
        </label>
        <textarea
          id="descricao"
          name="descricao"
          rows={3}
          maxLength={2000}
          defaultValue={valores.descricao}
          className={campo}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="capa_url" className="block text-sm font-medium">
          Endereço da imagem de capa (opcional)
        </label>
        <input
          id="capa_url"
          name="capa_url"
          type="url"
          inputMode="url"
          placeholder="https://"
          defaultValue={valores.capa_url}
          className={campo}
        />
      </div>

      <label className="flex items-center gap-3 py-2">
        <input
          type="checkbox"
          name="publicado"
          defaultChecked={valores.publicado === "on"}
          className="size-5"
        />
        Publicado (visível para os alunos matriculados)
      </label>

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-md border border-current px-4 py-3 font-medium disabled:opacity-60 sm:w-auto"
      >
        {enviando ? "Salvando…" : textoDoBotao}
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
