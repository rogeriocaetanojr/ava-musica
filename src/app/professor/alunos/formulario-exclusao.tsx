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
      <p className="text-sm text-texto-secundario">
        Apaga a conta, o responsável, as matrículas e todo o progresso de{" "}
        <strong className="break-words">{nome}</strong>. Não dá para desfazer.
      </p>
      <label className="block space-y-2">
        <span className="block text-sm font-bold text-texto">
          Para confirmar, digite o nome do aluno
        </span>
        <input
          name="confirmacao"
          autoComplete="off"
          value={digitado}
          onChange={(e) => setDigitado(e.target.value)}
          className="min-h-14 w-full rounded-xl border border-borda-campo bg-superficie px-4 py-3 text-base text-texto"
        />
      </label>
      {estado.erro && (
        <p
          role="alert"
          className="rounded-xl bg-amarelo-claro p-4 text-sm text-texto-sobre-amarelo"
        >
          {estado.erro}
        </p>
      )}
      <button
        type="submit"
        disabled={!confere || enviando}
        className="inline-flex min-h-12 items-center justify-center rounded-xl bg-bordo px-5 py-3 font-bold text-superficie hover:bg-vinho disabled:opacity-60"
      >
        {enviando ? "Excluindo…" : "Excluir todos os dados"}
      </button>
    </form>
  );
}
