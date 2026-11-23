"use server";

import { revalidatePath } from "next/cache";
import type { ResultadoDaAcao } from "@/lib/acoes";
import { exigirProfessor } from "@/lib/auth";
import {
  type Direcao,
  ehDirecao,
  type ItemOrdenado,
  proximaOrdem,
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

// Mesma troca dos módulos e aulas: o banco (mover_item) faz tudo numa
// transação só, e dois cliques seguidos esperam um pelo outro.
export async function moverBloco(
  blocoId: string,
  direcao: Direcao,
): Promise<ResultadoDaAcao> {
  await exigirProfessor();
  if (!ehUuid(blocoId) || !ehDirecao(direcao)) return { erro: ERRO_ID };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("mover_item", {
    tabela: "conteudos",
    item: blocoId,
    direcao,
  });
  atualizarTela();
  if (error) return { erro: error.code === "P0002" ? ERRO_ID : ERRO_MOVER };
  return {};
}
