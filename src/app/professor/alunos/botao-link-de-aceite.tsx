"use client";

import { useActionState } from "react";
import { type EstadoAceite, gerarLinkDeAceite } from "./acoes";
import { Botao } from "@/components/botao";
import { BotaoCopiar } from "./botao-copiar";

// O banco guarda só o hash do link de autorização, então a ficha não consegue
// mostrar o link antigo: o professor gera um novo, que aparece uma vez aqui.
export function BotaoLinkDeAceite({ alunoId }: { alunoId: string }) {
  const [estado, gerar, gerando] = useActionState<EstadoAceite>(
    gerarLinkDeAceite.bind(null, alunoId),
    {},
  );

  return (
    <form action={gerar} className="space-y-2">
      <Botao
        type="submit"
        disabled={gerando}
        variante="secundario"
        tamanho="pequeno"
      >
        {gerando ? "Gerando…" : "Gerar link de autorização"}
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
          {estado.linkAceite && (
            <BotaoCopiar
              texto={estado.linkAceite}
              rotulo="Link de autorização do responsável"
            />
          )}
        </div>
      )}
    </form>
  );
}
