"use client";

import { useActionState } from "react";
import { Botao } from "@/components/botao";
import { bloquearAluno, desbloquearAluno } from "./acoes";

// Conteúdo do painel "Bloquear acesso" (ou "Desbloquear acesso") do menu da
// ficha: o aviso e o botão de confirmar.
export function ConfirmacaoBloqueio({
  alunoId,
  nome,
  bloqueado,
  aoCancelar,
}: {
  alunoId: string;
  nome: string;
  bloqueado: boolean;
  aoCancelar: () => void;
}) {
  const [estado, enviar, enviando] = useActionState(
    () => (bloqueado ? desbloquearAluno : bloquearAluno)(alunoId),
    {},
  );
  const acao = bloqueado ? "Desbloquear acesso" : "Bloquear acesso";

  return (
    <form action={enviar} className="space-y-4">
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
      {estado.sucesso ? (
        <p
          role="status"
          className="rounded-xl bg-bloco-sucesso p-4 text-sm text-texto-sobre-bloco-sucesso"
        >
          {estado.sucesso}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Botao
            type="submit"
            disabled={enviando}
            variante={bloqueado ? "sucesso" : "perigo"}
            className="sm:w-auto"
          >
            {enviando ? "Salvando…" : `Confirmar: ${acao.toLowerCase()}`}
          </Botao>
          <Botao
            disabled={enviando}
            onClick={aoCancelar}
            variante="secundario"
            className="sm:w-auto"
          >
            Cancelar
          </Botao>
        </div>
      )}
    </form>
  );
}
