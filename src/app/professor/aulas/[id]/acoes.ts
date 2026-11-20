"use server";

import { revalidatePath } from "next/cache";
import type { ResultadoDaAcao } from "@/lib/acoes";
import { exigirProfessor } from "@/lib/auth";
import {
  type Direcao,
  ehDirecao,
  type ItemOrdenado,
  proximaOrdem,
  reordenar,
} from "@/lib/ordem";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import {
  ehUuid,
  type EstadoFormulario,
  valoresDigitados,
} from "../../cursos/validacao";
import { validarBloco } from "./validacao";

const ERRO_ID = "Item não encontrado. Recarregue a página.";
const ERRO_BANCO = "Não foi possível salvar. Tente de novo.";
const ERRO_MOVER = "Não foi possível mudar a ordem. Tente de novo.";

function atualizarTela() {
  revalidatePath("/professor/aulas/[id]", "page");
}

export async function criarBloco(
  aulaId: string,
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await exigirProfessor();
  if (!ehUuid(aulaId)) return { erro: ERRO_ID };

  const resultado = validarBloco(formData);
  if (!resultado.ok)
    return { erro: resultado.erro, valores: resultado.valores };

  const supabase = await criarClienteServidor();
  const { data: irmaos, error: erroLeitura } = await supabase
    .from("conteudos")
    .select("id, ordem")
    .eq("aula_id", aulaId);
  if (erroLeitura)
    return { erro: ERRO_BANCO, valores: valoresDigitados(formData) };

  const { error } = await supabase.from("conteudos").insert({
    ...resultado.dados,
    aula_id: aulaId,
    ordem: proximaOrdem((irmaos ?? []) as ItemOrdenado[]),
  });
  if (error) return { erro: ERRO_BANCO, valores: valoresDigitados(formData) };

  atualizarTela();
  return { sucesso: "Bloco adicionado." };
}

export async function editarBloco(
  blocoId: string,
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await exigirProfessor();
  if (!ehUuid(blocoId)) return { erro: ERRO_ID };

  const resultado = validarBloco(formData);
  if (!resultado.ok)
    return { erro: resultado.erro, valores: resultado.valores };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("conteudos")
    .update(resultado.dados)
    .eq("id", blocoId);
  if (error) return { erro: ERRO_BANCO, valores: valoresDigitados(formData) };

  atualizarTela();
  return { sucesso: "Bloco salvo." };
}

export async function removerBloco(blocoId: string): Promise<ResultadoDaAcao> {
  await exigirProfessor();
  if (!ehUuid(blocoId)) return { erro: ERRO_ID };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("conteudos").delete().eq("id", blocoId);
  if (error)
    return { erro: "Não foi possível remover o bloco. Tente de novo." };
  atualizarTela();
  return {};
}

// Mesma estratégia dos módulos e aulas: sem transação, o próximo clique
// renumera a lista inteira se uma gravação falhar no meio.
export async function moverBloco(
  blocoId: string,
  direcao: Direcao,
): Promise<ResultadoDaAcao> {
  await exigirProfessor();
  if (!ehUuid(blocoId) || !ehDirecao(direcao)) return { erro: ERRO_ID };

  const supabase = await criarClienteServidor();
  const { data: bloco, error: erroBloco } = await supabase
    .from("conteudos")
    .select("aula_id")
    .eq("id", blocoId)
    .maybeSingle();
  if (erroBloco) return { erro: ERRO_MOVER };
  if (!bloco) return { erro: ERRO_ID };

  const { data: irmaos, error: erroIrmaos } = await supabase
    .from("conteudos")
    .select("id, ordem")
    .eq("aula_id", bloco.aula_id);
  if (erroIrmaos) return { erro: ERRO_MOVER };
  for (const item of reordenar(
    (irmaos ?? []) as ItemOrdenado[],
    blocoId,
    direcao,
  )) {
    const { error } = await supabase
      .from("conteudos")
      .update({ ordem: item.ordem })
      .eq("id", item.id);
    if (error) {
      // A ordem pode ter ficado pela metade: a tela mostra o que foi gravado.
      atualizarTela();
      return { erro: ERRO_MOVER };
    }
  }
  atualizarTela();
  return {};
}
