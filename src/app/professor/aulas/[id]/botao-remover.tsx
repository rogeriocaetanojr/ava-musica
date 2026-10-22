"use client";

type Props = {
  remover: () => Promise<void>;
  className: string;
};

// Pede confirmação antes de enviar, porque a remoção não tem volta.
export function BotaoRemover({ remover, className }: Props) {
  return (
    <form
      action={remover}
      onSubmit={(e) => {
        if (!window.confirm("Remover este bloco? Isso não pode ser desfeito."))
          e.preventDefault();
      }}
    >
      <button type="submit" className={className}>
        Remover
      </button>
    </form>
  );
}
