"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { classesDoBotao } from "@/components/botao";

// Pedidos de acesso e recusados recentes. No computador ficam à vista, nos
// mesmos lugares de antes; no celular saem da página e vão para um painel que
// sobe do rodapé ao tocar no botão com a quantidade de pedidos, como o Novo
// bloco da aula. O painel é uma div, e não uma section, para cada cartão
// continuar sendo a única seção com o seu título. No celular, o Convidar aluno
// fica aqui, lado a lado com o botão dos pedidos.
export function GavetaDePedidos({
  quantidade,
  pedidos,
  recusados,
}: {
  quantidade: number | null;
  pedidos: ReactNode;
  recusados: ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const painel = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);

  function fechar() {
    setAberto(false);
    botao.current?.focus();
  }

  useEffect(() => {
    if (!aberto) return;
    painel.current?.querySelector("button")?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAberto(false);
      botao.current?.focus();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  const comPedidos = (quantidade ?? 0) > 0;

  return (
    <>
      <div className="order-1 grid grid-cols-2 gap-3 md:hidden">
        <Link
          href="/professor/alunos/convidar"
          className={classesDoBotao("primario", "px-3")}
        >
          Convidar aluno
        </Link>
        <button
          ref={botao}
          type="button"
          aria-expanded={aberto}
          onClick={() => setAberto(true)}
          className={classesDoBotao(
            comPedidos ? "destaque" : "secundario",
            "px-3",
          )}
        >
          {/* Na tela cabe só "Pedidos"; o nome acessível continua completo. */}
          <span>
            Pedidos<span className="sr-only"> de acesso</span>
            {quantidade !== null && ` · ${quantidade}`}
          </span>
        </button>
      </div>

      {aberto && (
        <div
          aria-hidden="true"
          onClick={fechar}
          className="fixed inset-0 z-20 bg-texto/40 md:hidden"
        />
      )}
      <div
        ref={painel}
        {...(aberto && {
          role: "dialog",
          "aria-modal": true,
          "aria-label": "Pedidos de acesso",
        })}
        className={
          aberto
            ? "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:max-h-[85dvh] max-md:space-y-4 max-md:overflow-y-auto max-md:rounded-t-3xl max-md:bg-fundo max-md:p-4 max-md:pb-[calc(1rem+env(safe-area-inset-bottom))] md:contents"
            : "max-md:hidden md:contents"
        }
      >
        <div className="ml-auto w-fit md:hidden">
          <button
            type="button"
            onClick={fechar}
            className={classesDoBotao("secundario")}
          >
            Fechar
          </button>
        </div>
        <div className="md:order-1 lg:order-none">{pedidos}</div>
        <div className="md:order-3 lg:order-none">{recusados}</div>
      </div>
    </>
  );
}
