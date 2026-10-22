"use client";

import { useActionState, useState } from "react";
import { bloquearAluno, desbloquearAluno } from "./acoes";

// Pede uma confirmação antes de bloquear ou desbloquear.
export function BotaoBloqueio({
  alunoId,
  nome,
  bloqueado,
}: {
  alunoId: string;
  nome: string;
  bloqueado: boolean;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [estado, enviar, enviando] = useActionState(async () => {
    const resultado = await (bloqueado ? desbloquearAluno : bloquearAluno)(
      alunoId,
    );
    setConfirmando(false);
    return resultado;
  }, {});
  const acao = bloqueado ? "Desbloquear acesso" : "Bloquear acesso";

  return (
    <form action={enviar} className="space-y-3">
      <p className="text-sm">
        {bloqueado ? (
          <>
            <strong className="break-words">{nome}</strong> não consegue entrar
            no site. Ao desbloquear, volta a ver os cursos e o progresso.
          </>
        ) : (
          <>
            Bloquear encerra o acesso de{" "}
            <strong className="break-words">{nome}</strong> na hora e impede
            novos logins. Os dados e o progresso continuam guardados.
          </>
        )}
      </p>
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
      {confirmando ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={enviando}
            className={
              bloqueado
                ? "rounded-md border border-current px-4 py-2 font-semibold disabled:opacity-50"
                : "rounded-md bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
            }
          >
            {enviando ? "Salvando…" : `Confirmar: ${acao.toLowerCase()}`}
          </button>
          <button
            type="button"
            disabled={enviando}
            onClick={() => setConfirmando(false)}
            className="rounded-md border border-current px-4 py-2 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="rounded-md border border-current px-4 py-2"
        >
          {acao}
        </button>
      )}
    </form>
  );
}
