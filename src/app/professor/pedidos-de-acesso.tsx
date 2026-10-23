"use client";

import { useActionState, useState } from "react";
import { formatarDataHora } from "@/lib/datas";
import { ehDataValida, hojeNoBrasil, precisaDeAceite } from "@/lib/idade";
import { liberarPedido, recusarPedido } from "./alunos/acoes";

export type Pedido = {
  id: string;
  nome: string;
  email: string;
  criado_em: string;
};

const campo =
  "w-full rounded-md border border-current bg-transparent px-3 py-2";

// O aviso fica aqui, fora de cada pedido: depois de liberar ou recusar o
// pedido sai da lista, mas a confirmação continua na tela.
export function PedidosDeAcesso({ pedidos }: { pedidos: Pedido[] }) {
  const [aviso, setAviso] = useState("");

  return (
    <div className="space-y-3">
      {aviso && (
        <p role="status" className="rounded-md bg-green-100 p-3 text-green-800">
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
    </div>
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
    <div className="space-y-3 rounded-md border border-current p-4">
      <div className="space-y-1">
        <p className="font-medium break-words">{pedido.nome}</p>
        <p className="text-sm break-all">{pedido.email}</p>
        <p className="text-sm">
          Pediu acesso em {formatarDataHora(pedido.criado_em)}
        </p>
      </div>

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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAbrindo("liberar")}
            className="rounded-md border border-current px-4 py-2 font-medium"
          >
            Liberar
          </button>
          <button
            type="button"
            onClick={() => setAbrindo("recusar")}
            className="rounded-md border border-current px-4 py-2"
          >
            Recusar
          </button>
        </div>
      )}
    </div>
  );
}

// A data de nascimento não vem do Google; o professor informa para aplicar a
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
        <span className="text-sm font-medium">Data de nascimento</span>
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
        <fieldset className="space-y-3 rounded-md border border-current/50 p-3">
          <legend className="px-1 text-sm font-medium">Responsável</legend>
          <p className="text-sm">
            Menos de 12 anos: o acesso só começa depois que o responsável
            autorizar. Em seguida você vai para a ficha do aluno, com o link de
            autorização.
          </p>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Nome do responsável</span>
            <input
              name="responsavel_nome"
              required
              maxLength={120}
              className={campo}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">E-mail do responsável</span>
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
        <p role="alert" className="rounded-md bg-red-100 p-3 text-red-800">
          {estado.erro}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-md border border-current px-4 py-2 font-semibold disabled:opacity-50"
        >
          {enviando ? "Salvando…" : "Confirmar liberação"}
        </button>
        <button
          type="button"
          disabled={enviando}
          onClick={aoCancelar}
          className="rounded-md border border-current px-4 py-2 disabled:opacity-50"
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
        <strong className="break-words">{pedido.nome}</strong>. A pessoa pode
        pedir de novo entrando com o Google.
      </p>
      {estado.erro && (
        <p role="alert" className="rounded-md bg-red-100 p-3 text-red-800">
          {estado.erro}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          {enviando ? "Salvando…" : "Confirmar recusa"}
        </button>
        <button
          type="button"
          disabled={enviando}
          onClick={aoCancelar}
          className="rounded-md border border-current px-4 py-2 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
