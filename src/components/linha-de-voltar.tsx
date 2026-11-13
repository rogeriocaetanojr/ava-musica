import type { ReactNode } from "react";
import { BotaoVoltar } from "@/components/botao-voltar";

// Primeira linha do conteúdo das telas internas: a seta de voltar e, ao lado,
// a trilha, o título ou o nome.
export function LinhaDeVoltar({
  href,
  rotulo,
  children,
}: {
  href: string;
  rotulo: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4">
      <BotaoVoltar href={href} rotulo={rotulo} />
      {children && <div className="min-w-0 flex-1">{children}</div>}
    </div>
  );
}
