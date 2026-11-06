import type { ReactNode } from "react";
import { ConteudoDoMaterial } from "@/components/material-da-aula";
import type { TipoDeBloco } from "@/lib/embeds";

export type Bloco = {
  tipo: TipoDeBloco;
  titulo: string | null;
  texto: string | null;
  url: string | null;
};

type Props = {
  bloco: Bloco;
  // E-mail que substitui o marcador do Forms (o do aluno logado).
  email?: string;
  // Ações extras abaixo do bloco, como o "Enviei a prova" da área do aluno.
  children?: ReactNode;
};

// Um bloco de conteúdo da aula, usado na edição do professor e na área do aluno.
// Fora o texto, aparece igual ao cartão de material da aula do aluno.
export function BlocoConteudo({ bloco, email, children }: Props) {
  if (bloco.tipo === "texto")
    return (
      <article className="space-y-3">
        {bloco.titulo && (
          <h2 className="font-semibold break-words">{bloco.titulo}</h2>
        )}
        <p className="break-words whitespace-pre-wrap">{bloco.texto ?? ""}</p>
        {children}
      </article>
    );

  return (
    <article className="space-y-3 rounded-2xl border border-linha bg-superficie p-4">
      {bloco.tipo === "youtube" && bloco.titulo && (
        <h2 className="font-semibold break-words">{bloco.titulo}</h2>
      )}
      <ConteudoDoMaterial bloco={bloco} email={email} />
      {children}
    </article>
  );
}
