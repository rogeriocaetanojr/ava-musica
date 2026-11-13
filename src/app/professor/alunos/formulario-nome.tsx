"use client";

import { useActionState } from "react";
import { Botao } from "@/components/botao";
import { classesDoCampo } from "@/components/campo";
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
          className={classesDoCampo("min-w-0 flex-1")}
        />
        <Botao
          type="submit"
          disabled={enviando}
          variante="secundario"
          tamanho="pequeno"
          className="shrink-0"
        >
          {enviando ? "Salvando…" : "Salvar nome"}
        </Botao>
      </div>
      {estado.erro && (
        <p
          role="alert"
          className="rounded-xl bg-bloco p-4 text-sm text-texto-sobre-bloco"
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
