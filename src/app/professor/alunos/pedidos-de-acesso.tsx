"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { classesDoBotao } from "@/components/botao";
import { formatarDataHora } from "@/lib/datas";
import { ehDataValida, hojeNoBrasil, precisaDeAceite } from "@/lib/idade";
import { liberarPedido, recusarPedido } from "./acoes";

export type Pedido = {
  id: string;
  nome: string;
  email: string;
  pedido_em: string;
};

const campo =
  "min-h-14 w-full rounded-xl border border-borda-campo bg-superficie px-4 py-3 text-base text-texto";
const alerta = "rounded-xl bg-bloco p-4 text-sm text-texto-sobre-bloco";

// O aviso fica aqui, fora de cada pedido: depois de liberar ou recusar o
// pedido sai da lista, mas a confirmação continua na tela. Sem pedidos e sem
// confirmação, a seção só aparece no celular, dentro do painel de pedidos,
// com a mensagem de vazio.
export function PedidosDeAcesso({ pedidos }: { pedidos: Pedido[] }) {
  const [aviso, setAviso] = useState("");
  const vazia = pedidos.length === 0 && !aviso;

  return (
    <section
      aria-labelledby="pedidos-de-acesso"
      className={`space-y-4 rounded-3xl border border-amarelo bg-superficie p-5 ${vazia ? "md:hidden" : ""}`}
    >
      <h2 id="pedidos-de-acesso" className="font-titulo text-2xl text-texto">
        Pedidos de acesso
      </h2>
      {aviso && (
        <p
          role="status"
          className="rounded-xl border border-linha bg-fundo p-4 text-sm font-bold text-sucesso"
        >
          {aviso}
        </p>
      )}
      {pedidos.length === 0 ? (
        <p>Nenhum pedido aguardando.</p>
      ) : (
        <ul className="space-y-3">
          {pedidos.map((pedido) => (
            <li key={pedido.id}>
              <CartaoDoPedido pedido={pedido} aoResolver={setAviso} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CartaoDoPedido({
  pedido,
  aoResolver,
}: {
  pedido: Pedido;
  aoResolver: (aviso: string) => void;
}) {
  const [abrindo, setAbrindo] = useState<"liberar" | "recusar" | null>(null);

  return (
    <div className="space-y-2 rounded-2xl border border-linha bg-fundo p-3">
      <div className="space-y-0.5">
        <p className="text-sm font-bold text-texto break-words">
          {pedido.nome}
        </p>
        <p className="text-xs break-all text-texto-secundario">
          {pedido.email}
        </p>
        <p className="text-xs text-texto-secundario">
          Pediu acesso em {formatarDataHora(pedido.pedido_em)}
        </p>
      </div>
      <Link
        href={`/professor/alunos/${pedido.id}`}
        aria-label={`Ver ficha de ${pedido.nome}`}
        className="inline-flex min-h-12 items-center text-sm font-bold text-destaque underline"
      >
        Ver ficha
      </Link>

      {abrindo === "liberar" ? (
        <FormularioLiberacao
          pedido={pedido}
          aoCancelar={() => setAbrindo(null)}
          aoResolver={aoResolver}
        />
      ) : abrindo === "recusar" ? (
        <ConfirmacaoRecusa
          pedido={pedido}
          aoCancelar={() => setAbrindo(null)}
          aoResolver={aoResolver}
        />
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAbrindo("liberar")}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-linha bg-superficie px-3 py-2 text-sm font-bold text-texto transition-colors hover:border-borda-campo"
          >
            Liberar
          </button>
          <button
            type="button"
            onClick={() => setAbrindo("recusar")}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-linha bg-superficie px-3 py-2 text-sm font-bold text-texto transition-colors hover:border-borda-campo"
          >
            Recusar
          </button>
        </div>
      )}
    </div>
  );
}

// A data de nascimento não vem do pedido; o professor informa para aplicar a
// regra dos 12 anos. A decisão sobre o responsável aqui é só visual.
function FormularioLiberacao({
  pedido,
  aoCancelar,
  aoResolver,
}: {
  pedido: Pedido;
  aoCancelar: () => void;
  aoResolver: (aviso: string) => void;
}) {
  const hoje = hojeNoBrasil();
  const [nascimento, setNascimento] = useState("");
  const [estado, enviar, enviando] = useActionState(
    async (anterior: { erro?: string }, formData: FormData) => {
      const resultado = await liberarPedido(pedido.id, anterior, formData);
      if (resultado.sucesso) aoResolver(resultado.sucesso);
      return resultado;
    },
    {},
  );
  const menor =
    ehDataValida(nascimento) &&
    nascimento <= hoje &&
    precisaDeAceite(nascimento, hoje);

  return (
    <form action={enviar} className="space-y-3">
      <label className="block space-y-1">
        <span className="text-sm font-bold text-texto">Data de nascimento</span>
        <input
          name="data_nascimento"
          type="date"
          required
          max={hoje}
          value={nascimento}
          onChange={(e) => setNascimento(e.target.value)}
          className={campo}
        />
      </label>

      {menor && (
        <fieldset className="space-y-3 rounded-xl border border-linha p-4">
          <legend className="px-1 text-sm font-medium">Responsável</legend>
          <p className="text-sm">
            Menos de 12 anos: o acesso só começa depois que o responsável
            autorizar. Em seguida você vai para a ficha do aluno, com o link de
            autorização.
          </p>
          <label className="block space-y-1">
            <span className="text-sm font-bold text-texto">
              Nome do responsável
            </span>
            <input
              name="responsavel_nome"
              required
              maxLength={120}
              className={campo}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-bold text-texto">
              E-mail do responsável
            </span>
            <input
              name="responsavel_email"
              type="email"
              required
              maxLength={254}
              className={campo}
            />
          </label>
        </fieldset>
      )}

      {estado.erro && (
        <p role="alert" className={alerta}>
          {estado.erro}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={enviando}
          className={classesDoBotao("primario", "sm:w-auto")}
        >
          {enviando ? "Salvando…" : "Confirmar liberação"}
        </button>
        <button
          type="button"
          disabled={enviando}
          onClick={aoCancelar}
          className={classesDoBotao("secundario", "sm:w-auto")}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function ConfirmacaoRecusa({
  pedido,
  aoCancelar,
  aoResolver,
}: {
  pedido: Pedido;
  aoCancelar: () => void;
  aoResolver: (aviso: string) => void;
}) {
  const [estado, enviar, enviando] = useActionState(async () => {
    const resultado = await recusarPedido(pedido.id);
    if (resultado.sucesso)
      aoResolver(`Pedido de ${pedido.nome} recusado e conta apagada.`);
    return resultado;
  }, {});

  return (
    <form action={enviar} className="space-y-3">
      <p className="text-sm">
        Recusar apaga a conta de{" "}
        <strong className="break-words">{pedido.nome}</strong>. Por 7 dias, o
        e-mail não consegue pedir acesso de novo, a menos que você permita em
        &quot;Recusados recentemente&quot;.
      </p>
      {estado.erro && (
        <p role="alert" className={alerta}>
          {estado.erro}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={enviando}
          className={classesDoBotao("primario", "sm:w-auto")}
        >
          {enviando ? "Salvando…" : "Confirmar recusa"}
        </button>
        <button
          type="button"
          disabled={enviando}
          onClick={aoCancelar}
          className={classesDoBotao("secundario", "sm:w-auto")}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
