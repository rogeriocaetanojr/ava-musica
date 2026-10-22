"use client";

import { useActionState, useState } from "react";
import { confirmaExclusao } from "./validacao";
import { excluirAluno } from "./acoes";

// Pede para digitar o nome do aluno antes de liberar o botão; o servidor
// confere de novo antes de apagar.
export function FormularioExclusao({
  alunoId,
  nome,
}: {
  alunoId: string;
  nome: string;
}) {
  const [digitado, setDigitado] = useState("");
  const [estado, enviar, enviando] = useActionState(
    excluirAluno.bind(null, alunoId),
    {},
  );
  const confere = confirmaExclusao(digitado, nome);

  return (
    <form action={enviar} className="space-y-3">
      <p className="text-sm">
        Apaga a conta, o responsável, as matrículas e todo o progresso de{" "}
        <strong className="break-words">{nome}</strong>. Não dá para desfazer.
      </p>
      <label className="block space-y-1">
        <span className="text-sm font-medium">
          Para confirmar, digite o nome do aluno
        </span>
        <input
          name="confirmacao"
          autoComplete="off"
          value={digitado}
          onChange={(e) => setDigitado(e.target.value)}
          className="w-full rounded-md border border-current bg-transparent px-3 py-2"
        />
      </label>
      {estado.erro && (
        <p role="alert" className="rounded-md bg-red-100 p-3 text-red-800">
          {estado.erro}
        </p>
      )}
      <button
        type="submit"
        disabled={!confere || enviando}
        className="rounded-md bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
      >
        {enviando ? "Excluindo…" : "Excluir todos os dados"}
      </button>
    </form>
  );
}
