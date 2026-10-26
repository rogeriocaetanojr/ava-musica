"use client";

import { useActionState } from "react";
import type { EstadoFormulario } from "../cursos/validacao";
import { renomearAluno } from "./acoes";

// Nome do aluno na ficha. A mudança fica na auditoria.
export function FormularioNome({
  alunoId,
  nome,
}: {
  alunoId: string;
  nome: string;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(
    renomearAluno.bind(null, alunoId),
    {},
  );

  return (
    <form action={enviar} className="space-y-2">
      <label
        htmlFor="nome-do-aluno"
        className="block text-sm font-bold text-texto"
      >
        Nome completo
      </label>
      <div className="flex flex-col gap-2 md:flex-row">
        <input
          id="nome-do-aluno"
          name="nome"
          required
          maxLength={120}
          autoComplete="off"
          defaultValue={estado.valores?.nome ?? nome}
          className="min-h-12 min-w-0 flex-1 rounded-xl border border-borda-campo bg-superficie px-4 py-2 text-base text-texto"
        />
        <button
          type="submit"
          disabled={enviando}
          className="inline-flex min-h-12 items-center justify-center shrink-0 rounded-xl border border-linha bg-superficie px-5 py-3 font-bold text-texto hover:border-borda-campo disabled:opacity-60"
        >
          {enviando ? "Salvando…" : "Salvar nome"}
        </button>
      </div>
      {estado.erro && (
        <p
          role="alert"
          className="rounded-xl bg-amarelo-claro p-4 text-sm text-texto-sobre-amarelo"
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
