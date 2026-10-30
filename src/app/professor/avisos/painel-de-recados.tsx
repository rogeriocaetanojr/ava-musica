"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { Aviso as CaixaDeAviso } from "@/components/aviso";
import { Botao, classesDoBotao } from "@/components/botao";
import type { EstadoFormulario } from "../cursos/validacao";
import { BotaoApagar } from "./botao-apagar";
import { FormularioAviso } from "./formulario-aviso";

type Acao = (
  estado: EstadoFormulario,
  formData: FormData,
) => Promise<EstadoFormulario>;

export type RecadoDaLista = {
  id: string;
  titulo: string;
  texto: string;
  curso_id: string | null;
  // "Alunos de Violão · 26/10/2026, 14:15", montado na página.
  destinoEData: string;
  editar: Acao;
  apagar: () => Promise<void>;
};

type Props = {
  // Botão de voltar e título, que vêm prontos da página.
  cabecalho: ReactNode;
  criar: Acao;
  cursos: { id: string; titulo: string }[];
  recados: RecadoDaLista[] | null;
};

const tituloDeSecao = "font-titulo text-2xl text-texto";

// Lista de recados e o painel do formulário, que serve para o novo recado e
// para editar um enviado. No computador o painel abre na lateral; no celular
// sobe do rodapé. Fecha no Fechar, no Esc, tocando fora ou ao salvar, e o
// foco volta ao botão que o abriu.
export function PainelDeRecados({ cabecalho, criar, cursos, recados }: Props) {
  // null: fechado; "novo": novo recado; senão, o id do recado em edição.
  const [aberto, setAberto] = useState<string | null>(null);
  const painel = useRef<HTMLElement>(null);
  const origem = useRef<HTMLElement | null>(null);
  const emEdicao = recados?.find((r) => r.id === aberto);

  function abrir(qual: string) {
    origem.current = document.activeElement as HTMLElement | null;
    setAberto(qual);
  }

  function fechar() {
    setAberto(null);
    origem.current?.focus();
  }

  useEffect(() => {
    if (!aberto) return;
    painel.current?.querySelector("input")?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAberto(null);
      origem.current?.focus();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        {cabecalho}
        <div className="w-full sm:w-auto">
          <Botao
            aria-expanded={aberto === "novo"}
            onClick={() => abrir("novo")}
          >
            Novo recado
          </Botao>
        </div>
      </div>

      <section aria-labelledby="recados-enviados" className="space-y-4">
        <h2 id="recados-enviados" className={tituloDeSecao}>
          Recados enviados
        </h2>
        {recados === null ? (
          <CaixaDeAviso role="alert">
            Não foi possível carregar os recados.
          </CaixaDeAviso>
        ) : recados.length === 0 ? (
          <p className="text-texto-secundario">Nenhum recado enviado ainda.</p>
        ) : (
          <ul className="grid gap-4 md:auto-rows-fr md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
            {recados.map((recado, indice) => {
              // O mais recente vem em amarelo claro, como no painel do aluno.
              const recente = indice === 0;
              return (
                <li
                  key={recado.id}
                  className={`flex min-w-0 flex-col gap-3 rounded-3xl border p-5 md:p-6 ${
                    recente
                      ? "border-amarelo bg-bloco text-texto-sobre-bloco"
                      : "border-linha bg-superficie text-texto"
                  }`}
                >
                  {recente && (
                    <p className="flex items-center gap-2 text-sm font-bold">
                      <span
                        aria-hidden="true"
                        className="size-2.5 rounded-full bg-bordo"
                      />
                      Mais recente
                    </p>
                  )}
                  <h3 className="line-clamp-2 text-lg font-bold wrap-anywhere md:line-clamp-1">
                    {recado.titulo}
                  </h3>
                  <p className="line-clamp-3 wrap-anywhere md:line-clamp-2">
                    {recado.texto}
                  </p>
                  <p
                    className={`text-sm wrap-anywhere ${recente ? "" : "text-texto-secundario"}`}
                  >
                    {recado.destinoEData}
                  </p>
                  <div className="mt-auto flex gap-3 pt-2">
                    <div className="min-w-0 flex-1">
                      <Botao
                        variante="secundario"
                        aria-expanded={aberto === recado.id}
                        aria-label={`Editar ${recado.titulo}`}
                        onClick={() => abrir(recado.id)}
                        className="min-h-12 px-3"
                      >
                        Editar
                      </Botao>
                    </div>
                    <div className="min-w-0 flex-1">
                      <BotaoApagar
                        apagar={recado.apagar}
                        className={classesDoBotao(
                          "secundario",
                          "min-h-12 px-3",
                        )}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {aberto && (
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
            aria-labelledby="titulo-do-painel"
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] scroll-pb-6 space-y-4 overflow-y-auto overscroll-contain rounded-t-3xl border border-linha bg-superficie p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-full md:max-w-lg md:rounded-none md:rounded-l-3xl md:p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 id="titulo-do-painel" className={tituloDeSecao}>
                {emEdicao ? "Editar recado" : "Novo recado"}
              </h2>
              <div className="shrink-0">
                <Botao variante="secundario" onClick={fechar}>
                  Fechar
                </Botao>
              </div>
            </div>
            {/* A chave recria o formulário a cada recado aberto. */}
            {emEdicao ? (
              <FormularioAviso
                key={emEdicao.id}
                acao={emEdicao.editar}
                cursos={cursos}
                inicial={{
                  titulo: emEdicao.titulo,
                  texto: emEdicao.texto,
                  curso_id: emEdicao.curso_id ?? "",
                }}
                textoDoBotao="Salvar recado"
                prefixo={emEdicao.id}
                aoSalvar={fechar}
              />
            ) : (
              <FormularioAviso
                key="novo"
                acao={criar}
                cursos={cursos}
                textoDoBotao="Publicar recado"
                prefixo="novo"
                aoSalvar={fechar}
              />
            )}
          </section>
        </>
      )}
    </>
  );
}
