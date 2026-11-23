"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  Botao,
  type TamanhoDoBotao,
  type VarianteDoBotao,
} from "@/components/botao";

// Painel com formulário, como o de Novo recado: no computador na lateral
// direita; no celular, sobe do rodapé. Controlado por quem usa (ex.: o menu
// "⋯" da ficha, que abre um painel por opção). Fecha no Fechar, no Esc e
// tocando fora; o foco volta ao elemento de idDaOrigem. aoFechar precisa
// ser estável (useCallback), senão o foco inicial se repete a cada render.
export function Painel({
  aberto,
  aoFechar,
  titulo,
  idDaOrigem,
  children,
}: {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  // Id do botão que abriu o painel, para devolver o foco a ele.
  idDaOrigem?: string;
  children: ReactNode;
}) {
  const idDoTitulo = useId();
  const painel = useRef<HTMLElement>(null);

  function fechar() {
    aoFechar();
    if (idDaOrigem) document.getElementById(idDaOrigem)?.focus();
  }

  useEffect(() => {
    if (!aberto) return;
    painel.current
      ?.querySelector<HTMLElement>(
        "input[type=radio]:checked, input:not([type=radio]), textarea",
      )
      ?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      aoFechar();
      if (idDaOrigem) document.getElementById(idDaOrigem)?.focus();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto, aoFechar, idDaOrigem]);

  if (!aberto) return null;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={fechar}
        className="fixed inset-0 z-40 bg-veu/40"
      />
      <section
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idDoTitulo}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] scroll-pb-6 space-y-4 overflow-y-auto overscroll-contain rounded-t-3xl border border-linha bg-superficie p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-left md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-full md:max-w-lg md:rounded-none md:rounded-l-3xl md:p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id={idDoTitulo} className="font-titulo text-2xl text-texto">
            {titulo}
          </h2>
          <div className="shrink-0">
            <Botao variante="secundario" onClick={fechar}>
              Fechar
            </Botao>
          </div>
        </div>
        {children}
      </section>
    </>
  );
}

// Botão que abre o Painel. O conteúdo recebe a função fechar, para fechar
// ao salvar.
export function PainelLateral({
  rotulo,
  titulo = rotulo,
  variante = "primario",
  tamanho = "normal",
  classeDoBotao = "sm:w-auto",
  rotuloAcessivel,
  botaoProprio,
  abertoNoInicio = false,
  children,
}: {
  // Já aberto ao carregar a tela (ex.: /professor/alunos?pedidos=abrir).
  abertoNoInicio?: boolean;
  // Texto do botão; o título do painel, se não vier outro.
  rotulo: string;
  titulo?: string;
  variante?: VarianteDoBotao;
  tamanho?: TamanhoDoBotao;
  classeDoBotao?: string;
  // Nome acessível do botão, quando o texto se repete na página.
  rotuloAcessivel?: string;
  // Botão próprio (ex.: só o ícone de editar): estas classes e este conteúdo
  // no lugar do Botao padrão.
  botaoProprio?: { className: string; conteudo: ReactNode };
  children: (fechar: () => void) => ReactNode;
}) {
  const [aberto, setAberto] = useState(abertoNoInicio);
  // O foco volta ao botão pelo id: a função fechar vai para o conteúdo do
  // painel durante a renderização, onde a regra dos refs não deixa lê-los.
  const idDoBotao = useId();
  // Estável: o Painel só refaz o foco inicial quando abre.
  const aoFechar = useCallback(() => setAberto(false), []);

  function fechar() {
    setAberto(false);
    document.getElementById(idDoBotao)?.focus();
  }

  return (
    <>
      {botaoProprio ? (
        <button
          id={idDoBotao}
          type="button"
          aria-expanded={aberto}
          aria-label={rotuloAcessivel}
          onClick={() => setAberto(true)}
          className={botaoProprio.className}
        >
          {botaoProprio.conteudo}
        </button>
      ) : (
        <Botao
          id={idDoBotao}
          variante={variante}
          tamanho={tamanho}
          aria-expanded={aberto}
          aria-label={rotuloAcessivel}
          onClick={() => setAberto(true)}
          className={classeDoBotao}
        >
          {rotulo}
        </Botao>
      )}

      <Painel
        aberto={aberto}
        aoFechar={aoFechar}
        titulo={titulo}
        idDaOrigem={idDoBotao}
      >
        {aberto && children(fechar)}
      </Painel>
    </>
  );
}
