"use client";

import { useActionState, useState } from "react";
import { Botao } from "@/components/botao";
import { classesDoCampo } from "@/components/campo";
import { formatarDataHora } from "@/lib/datas";
import { permitirNovoPedido, permitirNovoPedidoPorEmail } from "./acoes";

export type Recusa = {
  aluno_id: string;
  dica: string;
  recusado_em: string;
  vale_ate: string;
};

// Foco do navegador no lugar do contorno amarelo do site.
const campo = classesDoCampo(
  "focus-visible:[outline:auto] focus-visible:outline-offset-0",
);
const alerta = "rounded-xl bg-bloco p-4 text-sm text-texto-sobre-bloco";

// Quem foi recusado não consegue pedir de novo por 7 dias. O banco guarda só
// o hash do e-mail e uma dica mascarada (a***@g***.com); o professor pode
// permitir pela lista ou digitando o e-mail completo.
export function RecusadosRecentes({ recusas }: { recusas: Recusa[] }) {
  const [aviso, setAviso] = useState("");

  return (
    <div className="space-y-3">
      {aviso && (
        <p
          role="status"
          className="rounded-xl border border-linha bg-fundo p-4 text-sm font-bold text-sucesso"
        >
          {aviso}
        </p>
      )}
      {recusas.length === 0 ? (
        <p className="text-texto-secundario">
          Nenhuma recusa nos últimos 7 dias.
        </p>
      ) : (
        <ul className="divide-y divide-linha rounded-2xl border border-linha">
          {recusas.map((recusa) => (
            <li key={recusa.aluno_id} className="p-3">
              <CartaoDaRecusa recusa={recusa} aoPermitir={setAviso} />
            </li>
          ))}
        </ul>
      )}
      <PermitirPorEmail aoPermitir={setAviso} />
    </div>
  );
}

function CartaoDaRecusa({
  recusa,
  aoPermitir,
}: {
  recusa: Recusa;
  aoPermitir: (aviso: string) => void;
}) {
  const [estado, enviar, enviando] = useActionState(async () => {
    const resultado = await permitirNovoPedido(recusa.aluno_id);
    if (resultado.sucesso) aoPermitir(resultado.sucesso);
    return resultado;
  }, {});

  return (
    <form action={enviar} className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1 basis-48">
          <p className="font-bold break-all text-texto">{recusa.dica}</p>
          <p className="text-xs text-texto-secundario">
            Recusado em {formatarDataHora(recusa.recusado_em)} · bloqueado até{" "}
            {formatarDataHora(recusa.vale_ate)}
          </p>
        </div>
        <Botao
          type="submit"
          disabled={enviando}
          variante="sucesso"
          tamanho="pequeno"
        >
          {enviando ? "Salvando…" : "Permitir novo pedido"}
        </Botao>
      </div>
      {estado.erro && (
        <p role="alert" className={alerta}>
          {estado.erro}
        </p>
      )}
    </form>
  );
}

function PermitirPorEmail({
  aoPermitir,
}: {
  aoPermitir: (aviso: string) => void;
}) {
  const [estado, enviar, enviando] = useActionState(
    async (
      anterior: Awaited<ReturnType<typeof permitirNovoPedidoPorEmail>>,
      formData: FormData,
    ) => {
      const resultado = await permitirNovoPedidoPorEmail(anterior, formData);
      if (resultado.sucesso) aoPermitir(resultado.sucesso);
      return resultado;
    },
    {},
  );

  return (
    <form action={enviar} className="space-y-2 border-t border-linha pt-4">
      <label
        htmlFor="permitir-por-email"
        className="block text-sm font-bold text-texto"
      >
        Permitir novo pedido pelo e-mail
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="permitir-por-email"
          name="email"
          type="email"
          required
          maxLength={254}
          defaultValue={estado.sucesso ? "" : estado.valores?.email}
          key={estado.sucesso}
          className={`${campo} min-w-0 flex-1`}
        />
        <Botao
          type="submit"
          disabled={enviando}
          variante="sucesso"
          className="shrink-0 sm:w-auto"
        >
          {enviando ? "Salvando…" : "Permitir"}
        </Botao>
      </div>
      {estado.erro && (
        <p role="alert" className={alerta}>
          {estado.erro}
        </p>
      )}
    </form>
  );
}
