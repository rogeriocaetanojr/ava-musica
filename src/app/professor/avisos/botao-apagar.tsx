"use client";

type Props = {
  apagar: () => Promise<void>;
  className: string;
};

// Pede confirmação antes de enviar, porque apagar o aviso não tem volta.
export function BotaoApagar({ apagar, className }: Props) {
  return (
    <form
      action={apagar}
      onSubmit={(e) => {
        if (!window.confirm("Apagar este aviso? Isso não pode ser desfeito."))
          e.preventDefault();
      }}
    >
      <button type="submit" className={className}>
        Apagar
      </button>
    </form>
  );
}
