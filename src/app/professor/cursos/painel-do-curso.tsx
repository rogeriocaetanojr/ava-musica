"use client";

import type { ReactNode } from "react";
import type { VarianteDoBotao } from "@/components/botao";
import { PainelLateral } from "@/components/painel-lateral";
import type { EstadoFormulario } from "./validacao";
import { FormularioCurso } from "./formulario-curso";

// Formulário do curso no painel lateral. Serve para o Novo curso (a ação
// leva à página do curso criado) e para o Editar curso, já preenchido, que
// fecha ao salvar.
export function PainelDoCurso({
  rotulo,
  acao,
  textoDoBotao,
  inicial,
  variante = "primario",
  extra,
}: {
  rotulo: string;
  acao: (
    estado: EstadoFormulario,
    formData: FormData,
  ) => Promise<EstadoFormulario>;
  textoDoBotao: string;
  inicial?: Record<string, string>;
  variante?: VarianteDoBotao;
  // Conteúdo extra no fim do painel (ex.: Excluir curso).
  extra?: ReactNode;
}) {
  return (
    <PainelLateral rotulo={rotulo} variante={variante}>
      {(fechar) => (
        <>
          <FormularioCurso
            acao={acao}
            inicial={inicial}
            textoDoBotao={textoDoBotao}
            aoSalvar={inicial ? fechar : undefined}
          />
          {extra && <div className="border-t border-linha pt-4">{extra}</div>}
        </>
      )}
    </PainelLateral>
  );
}
