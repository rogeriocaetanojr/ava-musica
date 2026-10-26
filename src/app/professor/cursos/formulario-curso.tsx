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
  "min-h-14 w-full rounded-xl border border-borda-campo bg-superficie px-4 py-3 text-base text-texto placeholder:text-texto-secundario";
const rotulo = "block text-sm font-bold text-texto";

export function FormularioCurso({ acao, inicial = {}, textoDoBotao }: Props) {
  const [estado, enviar, enviando] = useActionState(acao, {});
  const valores = estado.valores ?? inicial;

  return (
    <form action={enviar} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="titulo" className={rotulo}>
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
        <div className="space-y-2">
          <label htmlFor="instrumento" className={rotulo}>
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
        <div className="space-y-2">
          <label htmlFor="nivel" className={rotulo}>
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

      <div className="space-y-2">
        <label htmlFor="descricao" className={rotulo}>
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

      <div className="space-y-2">
        <label htmlFor="capa_url" className={rotulo}>
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

      <label className="flex min-h-12 items-center gap-3 py-2">
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
        className="inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-bordo px-5 py-3 font-bold text-superficie hover:bg-vinho disabled:opacity-60 sm:w-auto"
      >
        {enviando ? "Salvando…" : textoDoBotao}
      </button>

      {estado.erro && (
        <p
          role="alert"
          className="rounded-xl bg-amarelo-claro p-4 text-texto-sobre-amarelo"
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
