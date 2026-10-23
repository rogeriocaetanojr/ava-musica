"use client";

import { useActionState, useState } from "react";
import { classesDoBotao } from "@/components/botao";
import { formatarDataHora } from "@/lib/datas";
import { permitirNovoPedido, permitirNovoPedidoPorEmail } from "./acoes";

export type Recusa = {
  aluno_id: string;
  dica: string;
  recusado_em: string;
  vale_ate: string;
};

const campo =
  "min-h-14 w-full rounded-xl border border-borda-campo bg-superficie px-4 py-3 text-base text-texto";
const alerta =
  "rounded-xl bg-amarelo-claro p-4 text-sm text-texto-sobre-amarelo";

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
        <p>Nenhuma recusa nos últimos 7 dias.</p>
      ) : (
        <ul className="space-y-3">
          {recusas.map((recusa) => (
            <li key={recusa.aluno_id}>
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
    <form
      action={enviar}
      className="space-y-3 rounded-2xl border border-linha bg-fundo p-4"
    >
      <div className="space-y-1">
        <p className="font-bold text-texto break-all">{recusa.dica}</p>
        <p className="text-sm">
          Recusado em {formatarDataHora(recusa.recusado_em)}. Não consegue pedir
          de novo até {formatarDataHora(recusa.vale_ate)}.
        </p>
      </div>
      {estado.erro && (
        <p role="alert" className={alerta}>
          {estado.erro}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className={classesDoBotao("secundario", "sm:w-auto")}
      >
        {enviando ? "Salvando…" : "Permitir novo pedido"}
      </button>
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
    <form action={enviar} className="space-y-3">
      <label className="block space-y-1">
        <span className="text-sm font-bold text-texto">
          Permitir novo pedido pelo e-mail
        </span>
        <input
          name="email"
          type="email"
          required
          maxLength={254}
          defaultValue={estado.sucesso ? "" : estado.valores?.email}
          key={estado.sucesso}
          className={campo}
        />
      </label>
      {estado.erro && (
        <p role="alert" className={alerta}>
          {estado.erro}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className={classesDoBotao("secundario", "sm:w-auto")}
      >
        {enviando ? "Salvando…" : "Permitir"}
      </button>
    </form>
  );
}
