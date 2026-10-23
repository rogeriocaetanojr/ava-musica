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
      <label htmlFor="nome-do-aluno" className="block text-sm font-medium">
        Nome completo
      </label>
      <div className="flex gap-2">
        <input
          id="nome-do-aluno"
          name="nome"
          required
          maxLength={120}
          autoComplete="off"
          defaultValue={estado.valores?.nome ?? nome}
          className="min-w-0 flex-1 rounded-md border border-current bg-transparent px-3 py-2"
        />
        <button
          type="submit"
          disabled={enviando}
          className="shrink-0 rounded-md border border-current px-3 py-2 text-sm font-medium disabled:opacity-60"
        >
          {enviando ? "Salvando…" : "Salvar nome"}
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
