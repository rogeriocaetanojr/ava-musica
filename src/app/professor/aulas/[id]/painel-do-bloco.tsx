"use client";

import type { ReactNode } from "react";
import type { Bloco } from "@/components/bloco-conteudo";
import { PainelLateral } from "@/components/painel-lateral";
import type { EstadoFormulario } from "../../cursos/validacao";
import { FormularioBloco } from "./formulario-bloco";

// Formulário do bloco no painel lateral: "Adicionar bloco" (vazio) ou
// "Editar bloco" (já preenchido). Fecha ao salvar.
export function PainelDoBloco({
  rotulo,
  acao,
  codigo,
  inicial,
  rotuloAcessivel,
  botaoProprio,
}: {
  rotulo: string;
  acao: (
    estado: EstadoFormulario,
    formData: FormData,
  ) => Promise<EstadoFormulario>;
  // Código do professor, para a pré-visualização da prova.
  codigo: string;
  inicial?: Bloco;
  rotuloAcessivel?: string;
  botaoProprio?: { className: string; conteudo: ReactNode };
}) {
  return (
    <PainelLateral
      rotulo={rotulo}
      titulo={inicial ? "Editar bloco" : "Adicionar bloco"}
      rotuloAcessivel={rotuloAcessivel}
      botaoProprio={botaoProprio}
    >
      {(fechar) => (
        <FormularioBloco
          acao={acao}
          textoDoBotao={inicial ? "Salvar bloco" : "Adicionar bloco"}
          inicial={inicial}
          codigo={codigo}
          aoSalvar={fechar}
        />
      )}
    </PainelLateral>
  );
}
