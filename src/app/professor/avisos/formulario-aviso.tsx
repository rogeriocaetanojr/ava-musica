"use client";

import { useActionState } from "react";
import type { EstadoFormulario } from "../cursos/validacao";

type Props = {
  acao: (
    estado: EstadoFormulario,
    formData: FormData,
  ) => Promise<EstadoFormulario>;
  cursos: { id: string; titulo: string }[];
  inicial?: Record<string, string>;
  textoDoBotao: string;
  // Prefixo dos ids dos campos, porque a página tem vários formulários.
  prefixo: string;
};

const campo =
  "w-full rounded-md border border-current bg-transparent px-3 py-3";

export function FormularioAviso({
  acao,
  cursos,
  inicial = {},
  textoDoBotao,
  prefixo,
}: Props) {
  const [estado, enviar, enviando] = useActionState(acao, {});
  const valores = estado.valores ?? inicial;

  // A chave muda com os valores devolvidos, para os campos recarregarem
  // (e o formulário de novo aviso ficar limpo depois de publicar).
  return (
    <form key={JSON.stringify(valores)} action={enviar} className="space-y-4">
      <div className="space-y-1">
        <label
          htmlFor={`${prefixo}-titulo`}
          className="block text-sm font-medium"
        >
          Título
        </label>
        <input
          id={`${prefixo}-titulo`}
          name="titulo"
          required
          maxLength={120}
          defaultValue={valores.titulo}
          className={campo}
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor={`${prefixo}-texto`}
          className="block text-sm font-medium"
        >
          Texto
        </label>
        <textarea
          id={`${prefixo}-texto`}
          name="texto"
          required
          rows={4}
          maxLength={2000}
          defaultValue={valores.texto}
          className={campo}
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor={`${prefixo}-curso`}
          className="block text-sm font-medium"
        >
          Para quem
        </label>
        <select
          id={`${prefixo}-curso`}
          name="curso_id"
          defaultValue={valores.curso_id ?? ""}
          className={campo}
        >
          <option value="">Todos os alunos</option>
          {cursos.map((curso) => (
            <option key={curso.id} value={curso.id}>
              Alunos de {curso.titulo}
            </option>
          ))}
        </select>
      </div>

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
