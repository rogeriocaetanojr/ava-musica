"use client";

import { useActionState } from "react";
import type { ResultadoDaAcao } from "@/lib/acoes";

// Formulário de um botão só que mostra o erro da ação na tela. Sem isso, uma
// gravação que falha no banco passa em silêncio: a página recarrega e nada
// muda. Com `confirmar`, pergunta antes de enviar (ações sem volta).
export function FormularioDeAcao({
  acao,
  confirmar,
  className,
  children,
}: {
  acao: (
    estado: ResultadoDaAcao,
    formData: FormData,
  ) => Promise<ResultadoDaAcao>;
  confirmar?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [estado, enviar] = useActionState(acao, {});

  return (
    <form
      action={enviar}
      className={className}
      onSubmit={(evento) => {
        if (confirmar && !window.confirm(confirmar)) evento.preventDefault();
      }}
    >
      {children}
      {estado.erro && (
        <p
          role="alert"
          className="mt-2 rounded-xl bg-bloco p-3 text-sm text-texto-sobre-bloco"
        >
          {estado.erro}
        </p>
      )}
    </form>
  );
}
