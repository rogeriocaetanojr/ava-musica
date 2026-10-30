"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { classesDoBotao } from "@/components/botao";
import type { EstadoFormulario } from "../../cursos/validacao";
import { FormularioBloco } from "./formulario-bloco";

type Props = {
  acao: (
    estado: EstadoFormulario,
    formData: FormData,
  ) => Promise<EstadoFormulario>;
  email: string;
  // Botão de publicar do rodapé, que vem pronto da página.
  publicar: ReactNode;
  className: string;
  classeDoTitulo: string;
};

// Cartão "Novo bloco": no computador fica sempre à vista; no celular vira um
// painel que sobe do rodapé ao tocar em "Novo bloco" e fecha ao adicionar.
// É o mesmo formulário nos dois casos, só muda a classe.
export function NovoBloco({
  acao,
  email,
  publicar,
  className,
  classeDoTitulo,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const painel = useRef<HTMLElement>(null);
  const botao = useRef<HTMLButtonElement>(null);

  function fechar() {
    setAberto(false);
    botao.current?.focus();
  }

  useEffect(() => {
    if (!aberto) return;
    painel.current?.querySelector("select")?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAberto(false);
      botao.current?.focus();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  return (
    <>
      {aberto && (
        <div
          aria-hidden="true"
          onClick={fechar}
          className="fixed inset-0 z-20 bg-veu/40 md:hidden"
        />
      )}
      <section
        ref={painel}
        aria-labelledby="titulo-novo-bloco"
        {...(aberto && { role: "dialog", "aria-modal": true })}
        className={`space-y-4 border-dashed border-borda-campo ${className} ${
          aberto
            ? "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:max-h-[85dvh] max-md:overflow-y-auto max-md:rounded-b-none max-md:border-solid max-md:pb-[calc(1rem+env(safe-area-inset-bottom))]"
            : "max-md:hidden"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="titulo-novo-bloco" className={classeDoTitulo}>
            Novo bloco
          </h2>
          <div className="shrink-0 md:hidden">
            <button
              type="button"
              onClick={fechar}
              className={classesDoBotao("secundario")}
            >
              Fechar
            </button>
          </div>
        </div>
        <FormularioBloco
          acao={acao}
          textoDoBotao="Adicionar bloco"
          email={email}
          limparAoSalvar
          aoSalvar={fechar}
        />
      </section>

      {/* Rodapé fixo do celular, como na aula do aluno. */}
      <div className="fixed inset-x-0 bottom-0 z-10 flex gap-3 border-t border-linha bg-superficie px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden">
        <button
          ref={botao}
          type="button"
          aria-expanded={aberto}
          onClick={() => setAberto(true)}
          className={classesDoBotao("secundario", "min-w-0 flex-1 px-3")}
        >
          Novo bloco
        </button>
        <div className="min-w-0 flex-1">{publicar}</div>
      </div>
    </>
  );
}
