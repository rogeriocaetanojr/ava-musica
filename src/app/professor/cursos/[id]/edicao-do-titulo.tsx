"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

// O título aparece como texto e o botão de editar abre o formulário de
// renomear.
// O botão fica separado do título para ocupar sempre a mesma coluna da linha.

type Edicao = { editando: boolean; alternar: () => void };

const ContextoDaEdicao = createContext<Edicao>({
  editando: false,
  alternar: () => {},
});

export function EdicaoDoTitulo({ children }: { children: ReactNode }) {
  const [editando, setEditando] = useState(false);
  return (
    <ContextoDaEdicao.Provider
      value={{ editando, alternar: () => setEditando(!editando) }}
    >
      {children}
    </ContextoDaEdicao.Provider>
  );
}

export function TituloEditavel({
  titulo,
  classeDoTitulo,
  extra,
  children,
}: {
  titulo: string;
  classeDoTitulo: string;
  extra?: ReactNode;
  children: ReactNode;
}) {
  const { editando } = useContext(ContextoDaEdicao);

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 md:block md:flex-1 lg:flex lg:flex-nowrap lg:items-center lg:gap-3">
      {!editando && (
        <p
          title={titulo}
          className={`block min-w-0 break-words lg:truncate ${classeDoTitulo}`}
        >
          {titulo}
        </p>
      )}
      <div className={editando ? "w-full lg:min-w-0 lg:flex-1" : "hidden"}>
        {children}
      </div>
      {extra && !editando && (
        <div className="shrink-0 md:mt-1 lg:mt-0">{extra}</div>
      )}
    </div>
  );
}

// Mostra o conteúdo só durante a edição; fora dela, mostra `fora`.
export function AoEditar({
  children,
  fora,
}: {
  children: ReactNode;
  fora?: ReactNode;
}) {
  const { editando } = useContext(ContextoDaEdicao);
  return <>{editando ? children : fora}</>;
}

export function BotaoEditar({ nome }: { nome: string }) {
  const { editando, alternar } = useContext(ContextoDaEdicao);

  return (
    <button
      type="button"
      aria-label={editando ? `Fechar edição de ${nome}` : `Editar ${nome}`}
      aria-expanded={editando}
      onClick={alternar}
      className="grid size-12 shrink-0 place-items-center rounded-xl border border-linha bg-superficie text-texto hover:border-borda-campo"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        {editando ? (
          <path d="M6 6l12 12M18 6L6 18" />
        ) : (
          <path d="M4 20h4L19 9l-4-4L4 16v4z M13.5 6.5l4 4" />
        )}
      </svg>
    </button>
  );
}
