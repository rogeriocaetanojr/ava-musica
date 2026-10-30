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
      <p className="text-sm text-texto-secundario">
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
        <p
          role="alert"
          className="rounded-xl bg-bloco p-4 text-sm text-texto-sobre-bloco"
        >
          {estado.erro}
        </p>
      )}
      {estado.sucesso && (
        <p
          role="status"
          className="rounded-xl bg-linha p-4 text-sm text-sucesso"
        >
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
                ? "inline-flex min-h-12 items-center justify-center rounded-xl border border-linha bg-superficie px-5 py-3 font-bold text-texto hover:border-borda-campo disabled:opacity-60"
                : "inline-flex min-h-12 items-center justify-center rounded-xl bg-bordo px-5 py-3 font-bold text-sobre-bordo hover:bg-vinho disabled:opacity-60"
            }
          >
            {enviando ? "Salvando…" : `Confirmar: ${acao.toLowerCase()}`}
          </button>
          <button
            type="button"
            disabled={enviando}
            onClick={() => setConfirmando(false)}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-linha bg-superficie px-5 py-3 font-bold text-texto hover:border-borda-campo disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-linha bg-superficie px-5 py-3 font-bold text-texto hover:border-borda-campo"
        >
          {acao}
        </button>
      )}
    </form>
  );
}
