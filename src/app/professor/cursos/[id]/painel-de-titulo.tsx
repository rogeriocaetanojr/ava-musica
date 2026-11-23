"use client";

import type { TamanhoDoBotao, VarianteDoBotao } from "@/components/botao";
import { PainelLateral } from "@/components/painel-lateral";
import type { EstadoFormulario } from "../validacao";
import { FormularioTitulo } from "./formulario-titulo";

// Novo módulo, Nova aula e Editar aula: o campo de título no painel
// lateral, que fecha ao salvar.
export function PainelDeTitulo({
  rotulo,
  titulo,
  rotuloDoCampo,
  acao,
  variante,
  tamanho,
  classeDoBotao,
  rotuloAcessivel,
  inicial,
  textoDoBotao = "Adicionar",
}: {
  rotulo: string;
  titulo: string;
  rotuloDoCampo: string;
  acao: (
    estado: EstadoFormulario,
    formData: FormData,
  ) => Promise<EstadoFormulario>;
  variante?: VarianteDoBotao;
  tamanho?: TamanhoDoBotao;
  classeDoBotao?: string;
  rotuloAcessivel?: string;
  // Título atual, para renomear (Editar aula).
  inicial?: string;
  textoDoBotao?: string;
}) {
  return (
    <PainelLateral
      rotulo={rotulo}
      titulo={titulo}
      variante={variante}
      tamanho={tamanho}
      classeDoBotao={classeDoBotao}
      rotuloAcessivel={rotuloAcessivel}
    >
      {(fechar) => (
        <FormularioTitulo
          acao={acao}
          rotulo={rotuloDoCampo}
          textoDoBotao={textoDoBotao}
          inicial={inicial}
          comRotulo
          aoSalvar={fechar}
        />
      )}
    </PainelLateral>
  );
}
