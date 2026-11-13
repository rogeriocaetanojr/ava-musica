"use client";

import { useActionState } from "react";
import { type EstadoConvite, reenviarConvite } from "./acoes";
import { Botao } from "@/components/botao";
import { BotaoCopiar } from "./botao-copiar";

export function BotaoReenviar({ alunoId }: { alunoId: string }) {
  const [estado, enviar, enviando] = useActionState<EstadoConvite>(
    reenviarConvite.bind(null, alunoId),
    {},
  );

  return (
    <form action={enviar} className="space-y-2">
      <Botao
        type="submit"
        disabled={enviando}
        variante="secundario"
        tamanho="pequeno"
      >
        {enviando ? "Reenviando…" : "Reenviar convite"}
      </Botao>
      {estado.erro && (
        <p
          role="alert"
          className="rounded-xl bg-bloco p-4 text-sm text-texto-sobre-bloco"
        >
          {estado.erro}
        </p>
      )}
      {estado.sucesso && (
        <div role="status" className="space-y-2">
          <p className="rounded-xl bg-linha p-4 text-sm text-sucesso">
            {estado.sucesso}
          </p>
          {estado.linkConvite && (
            <BotaoCopiar
              texto={estado.linkConvite}
              rotulo="Link do convite do aluno"
            />
          )}
        </div>
      )}
    </form>
  );
}
