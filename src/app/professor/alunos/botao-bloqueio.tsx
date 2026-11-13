"use client";

import { useActionState, useState } from "react";
import { Botao } from "@/components/botao";
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
          <Botao
            type="submit"
            disabled={enviando}
            tamanho="pequeno"
            variante={bloqueado ? "secundario" : "primario"}
          >
            {enviando ? "Salvando…" : `Confirmar: ${acao.toLowerCase()}`}
          </Botao>
          <Botao
            disabled={enviando}
            onClick={() => setConfirmando(false)}
            variante="secundario"
            tamanho="pequeno"
          >
            Cancelar
          </Botao>
        </div>
      ) : (
        <Botao
          onClick={() => setConfirmando(true)}
          variante="secundario"
          tamanho="pequeno"
        >
          {acao}
        </Botao>
      )}
    </form>
  );
}
