"use client";

import { useActionState, useState } from "react";
import { Botao } from "@/components/botao";
import { classesDoCampo } from "@/components/campo";
import { formatarDataHora } from "@/lib/datas";
import {
  calcularIdade,
  ehDataValida,
  hojeNoBrasil,
  precisaDeAceite,
} from "@/lib/idade";
import { liberarPedido, recusarPedido } from "./acoes";

export type Pedido = {
  id: string;
  nome: string;
  email: string;
  pedido_em: string;
  // Quase sempre nula: a data de nascimento costuma vir na liberação.
  data_nascimento?: string | null;
};

const campo = classesDoCampo();
const alerta = "rounded-xl bg-bloco p-4 text-sm text-texto-sobre-bloco";

// Conteúdo do painel "Pedidos de acesso". O aviso fica aqui, fora de cada
// pedido: depois de liberar ou recusar, o pedido sai da lista, mas a
// confirmação continua na tela.
export function PedidosDeAcesso({ pedidos }: { pedidos: Pedido[] }) {
  const [aviso, setAviso] = useState("");

  return (
    <div className="space-y-3">
      {aviso && (
        <p
          role="status"
          className="rounded-xl border border-linha bg-fundo p-3 text-sm font-bold text-sucesso"
        >
          {aviso}
        </p>
      )}
      {pedidos.length === 0 ? (
        <p className="text-texto-secundario">Nenhum pedido aguardando.</p>
      ) : (
        <ul className="divide-y divide-linha rounded-2xl border border-linha">
          {pedidos.map((pedido) => (
            <li key={pedido.id} className="p-3">
              <CartaoDoPedido pedido={pedido} aoResolver={setAviso} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Linha compacta do pedido: nome, e-mail e data em texto pequeno e os
// botões Liberar (verde) e Recusar (vermelho), que abrem a
// confirmação logo abaixo.
function CartaoDoPedido({
  pedido,
  aoResolver,
}: {
  pedido: Pedido;
  aoResolver: (aviso: string) => void;
}) {
  const [abrindo, setAbrindo] = useState<"liberar" | "recusar" | null>(null);
  const idade = pedido.data_nascimento
    ? ` · ${calcularIdade(pedido.data_nascimento, hojeNoBrasil())} anos`
    : "";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1 basis-48">
          <p className="font-bold break-words text-texto">{pedido.nome}</p>
          <p className="text-sm break-all text-texto">{pedido.email}</p>
          <p className="text-xs text-texto-secundario">
            Pediu em {formatarDataHora(pedido.pedido_em)}
            {idade}
          </p>
        </div>
        {abrindo === null && (
          <div className="flex gap-2">
            <Botao
              onClick={() => setAbrindo("liberar")}
              variante="sucesso"
              tamanho="pequeno"
            >
              Liberar
            </Botao>
            <Botao
              onClick={() => setAbrindo("recusar")}
              variante="perigo"
              tamanho="pequeno"
            >
              Recusar
            </Botao>
          </div>
        )}
      </div>

      {abrindo === "liberar" && (
        <FormularioLiberacao
          pedido={pedido}
          aoCancelar={() => setAbrindo(null)}
          aoResolver={aoResolver}
        />
      )}
      {abrindo === "recusar" && (
        <ConfirmacaoRecusa
          pedido={pedido}
          aoCancelar={() => setAbrindo(null)}
          aoResolver={aoResolver}
        />
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
        <Botao
          type="submit"
          variante="sucesso"
          disabled={enviando}
          className="sm:w-auto"
        >
          {enviando ? "Salvando…" : "Confirmar liberação"}
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
        <Botao
          type="submit"
          variante="perigo"
          disabled={enviando}
          className="sm:w-auto"
        >
          {enviando ? "Salvando…" : "Confirmar recusa"}
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
    </form>
  );
}
