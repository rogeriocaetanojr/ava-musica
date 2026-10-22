"use server";

import { revalidatePath } from "next/cache";
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

export async function removerBloco(blocoId: string): Promise<void> {
  await exigirProfessor();
  if (!ehUuid(blocoId)) return;

  const supabase = await criarClienteServidor();
  await supabase.from("conteudos").delete().eq("id", blocoId);
  atualizarTela();
}

// Mesma estratégia dos módulos e aulas: sem transação, o próximo clique
// renumera a lista inteira se uma gravação falhar no meio.
export async function moverBloco(
  blocoId: string,
  direcao: Direcao,
): Promise<void> {
  await exigirProfessor();
  if (!ehUuid(blocoId) || !ehDirecao(direcao)) return;

  const supabase = await criarClienteServidor();
  const { data: bloco } = await supabase
    .from("conteudos")
    .select("aula_id")
    .eq("id", blocoId)
    .single();
  if (!bloco) return;

  const { data: irmaos } = await supabase
    .from("conteudos")
    .select("id, ordem")
    .eq("aula_id", bloco.aula_id);
  for (const item of reordenar(
    (irmaos ?? []) as ItemOrdenado[],
    blocoId,
    direcao,
  )) {
    await supabase
      .from("conteudos")
      .update({ ordem: item.ordem })
      .eq("id", item.id);
  }
  atualizarTela();
}
