"use client";

type Props = {
  remover: () => Promise<void>;
  nome: string;
  className: string;
};

// Pede confirmação antes de enviar, porque a remoção não tem volta.
export function BotaoRemover({ remover, nome, className }: Props) {
  return (
    <form
      action={remover}
      onSubmit={(e) => {
        if (!window.confirm("Remover este bloco? Isso não pode ser desfeito."))
          e.preventDefault();
      }}
    >
      <button
        type="submit"
        aria-label={`Excluir ${nome}`}
        className={className}
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
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
        </svg>
      </button>
    </form>
  );
}
