"use client";

type Props = {
  apagar: () => Promise<void>;
  className: string;
};

// Pede confirmação antes de enviar, porque apagar o recado não tem volta.
export function BotaoApagar({ apagar, className }: Props) {
  return (
    <form
      action={apagar}
      onSubmit={(e) => {
        if (!window.confirm("Apagar este recado? Isso não pode ser desfeito."))
          e.preventDefault();
      }}
    >
      <button type="submit" className={className}>
        Apagar
      </button>
    </form>
  );
}
