"use client";

import { FormularioDeAcao } from "@/components/formulario-de-acao";
import type { ResultadoDaAcao } from "@/lib/acoes";

type Props = {
  apagar: () => Promise<ResultadoDaAcao>;
  className: string;
};

// Pede confirmação antes de enviar, porque apagar o recado não tem volta.
export function BotaoApagar({ apagar, className }: Props) {
  return (
    <FormularioDeAcao
      acao={apagar}
      confirmar="Apagar este recado? Isso não pode ser desfeito."
    >
      <button type="submit" className={className}>
        Apagar
      </button>
    </FormularioDeAcao>
  );
}
