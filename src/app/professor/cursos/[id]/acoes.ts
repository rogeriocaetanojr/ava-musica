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
  validarCurso,
  validarTitulo,
  valoresDigitados,
} from "../validacao";

const ERRO_ID = "Item não encontrado. Recarregue a página.";
const ERRO_BANCO = "Não foi possível salvar. Tente de novo.";
const ERRO_MOVER = "Não foi possível mudar a ordem. Tente de novo.";

function atualizarTelas() {
  revalidatePath("/professor/cursos");
  revalidatePath("/professor/cursos/[id]", "page");
}

export async function editarCurso(
  cursoId: string,
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await exigirProfessor();
  if (!ehUuid(cursoId)) return { erro: ERRO_ID };

  const resultado = validarCurso(formData);
  if (!resultado.ok)
    return { erro: resultado.erro, valores: resultado.valores };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("cursos")
    .update(resultado.dados)
    .eq("id", cursoId);
  if (error) return { erro: ERRO_BANCO, valores: valoresDigitados(formData) };

  atualizarTelas();
  return { sucesso: "Curso salvo." };
}

export async function criarModulo(
  cursoId: string,
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await exigirProfessor();
  if (!ehUuid(cursoId)) return { erro: ERRO_ID };

  const resultado = validarTitulo(formData, "do módulo");
  if (!resultado.ok)
    return { erro: resultado.erro, valores: resultado.valores };

  const supabase = await criarClienteServidor();
  const { data: irmaos, error: erroLeitura } = await supabase
    .from("modulos")
    .select("id, ordem")
    .eq("curso_id", cursoId);
  if (erroLeitura)
    return { erro: ERRO_BANCO, valores: { titulo: resultado.dados } };

  const { error } = await supabase.from("modulos").insert({
    curso_id: cursoId,
    titulo: resultado.dados,
    ordem: proximaOrdem((irmaos ?? []) as ItemOrdenado[]),
  });
  if (error) return { erro: ERRO_BANCO, valores: { titulo: resultado.dados } };

  atualizarTelas();
  return {};
}

export async function renomearModulo(
  moduloId: string,
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await exigirProfessor();
  if (!ehUuid(moduloId)) return { erro: ERRO_ID };

  const resultado = validarTitulo(formData, "do módulo");
  if (!resultado.ok)
    return { erro: resultado.erro, valores: resultado.valores };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("modulos")
    .update({ titulo: resultado.dados })
    .eq("id", moduloId);
  if (error) return { erro: ERRO_BANCO, valores: { titulo: resultado.dados } };

  atualizarTelas();
  return { sucesso: "Salvo." };
}

export async function criarAula(
  moduloId: string,
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await exigirProfessor();
  if (!ehUuid(moduloId)) return { erro: ERRO_ID };

  const resultado = validarTitulo(formData, "da aula");
  if (!resultado.ok)
    return { erro: resultado.erro, valores: resultado.valores };

  const supabase = await criarClienteServidor();
  const { data: irmas, error: erroLeitura } = await supabase
    .from("aulas")
    .select("id, ordem")
    .eq("modulo_id", moduloId);
  if (erroLeitura)
    return { erro: ERRO_BANCO, valores: { titulo: resultado.dados } };

  const { error } = await supabase.from("aulas").insert({
    modulo_id: moduloId,
    titulo: resultado.dados,
    ordem: proximaOrdem((irmas ?? []) as ItemOrdenado[]),
  });
  if (error) return { erro: ERRO_BANCO, valores: { titulo: resultado.dados } };

  atualizarTelas();
  return {};
}

export async function renomearAula(
  aulaId: string,
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await exigirProfessor();
  if (!ehUuid(aulaId)) return { erro: ERRO_ID };

  const resultado = validarTitulo(formData, "da aula");
  if (!resultado.ok)
    return { erro: resultado.erro, valores: resultado.valores };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("aulas")
    .update({ titulo: resultado.dados })
    .eq("id", aulaId);
  if (error) return { erro: ERRO_BANCO, valores: { titulo: resultado.dados } };

  atualizarTelas();
  return { sucesso: "Salvo." };
}

export async function publicarAula(
  aulaId: string,
  publicada: boolean,
): Promise<ResultadoDaAcao> {
  await exigirProfessor();
  if (!ehUuid(aulaId) || typeof publicada !== "boolean")
    return { erro: ERRO_ID };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("aulas")
    .update({ publicada })
    .eq("id", aulaId);
  if (error)
    return {
      erro: publicada
        ? "Não foi possível publicar a aula. Tente de novo."
        : "Não foi possível despublicar a aula. Tente de novo.",
    };
  atualizarTelas();
  return {};
}

// Grava as ordens calculadas por reordenar(). Não há transação: se uma gravação
// falhar no meio, o próximo clique renumera a lista inteira e corrige a ordem.
// Para no primeiro erro, para a tela avisar.
async function gravarOrdem(
  tabela: "modulos" | "aulas",
  itens: ItemOrdenado[],
  id: string,
  direcao: Direcao,
): Promise<ResultadoDaAcao> {
  const supabase = await criarClienteServidor();
  for (const item of reordenar(itens, id, direcao)) {
    const { error } = await supabase
      .from(tabela)
      .update({ ordem: item.ordem })
      .eq("id", item.id);
    if (error) return { erro: ERRO_MOVER };
  }
  return {};
}

export async function moverModulo(
  moduloId: string,
  direcao: Direcao,
): Promise<ResultadoDaAcao> {
  await exigirProfessor();
  if (!ehUuid(moduloId) || !ehDirecao(direcao)) return { erro: ERRO_ID };

  const supabase = await criarClienteServidor();
  const { data: modulo, error: erroModulo } = await supabase
    .from("modulos")
    .select("curso_id")
    .eq("id", moduloId)
    .maybeSingle();
  if (erroModulo) return { erro: ERRO_MOVER };
  if (!modulo) return { erro: ERRO_ID };

  const { data: irmaos, error: erroIrmaos } = await supabase
    .from("modulos")
    .select("id, ordem")
    .eq("curso_id", modulo.curso_id);
  if (erroIrmaos) return { erro: ERRO_MOVER };
  const resultado = await gravarOrdem(
    "modulos",
    (irmaos ?? []) as ItemOrdenado[],
    moduloId,
    direcao,
  );
  atualizarTelas();
  return resultado;
}

export async function moverAula(
  aulaId: string,
  direcao: Direcao,
): Promise<ResultadoDaAcao> {
  await exigirProfessor();
  if (!ehUuid(aulaId) || !ehDirecao(direcao)) return { erro: ERRO_ID };

  const supabase = await criarClienteServidor();
  const { data: aula, error: erroAula } = await supabase
    .from("aulas")
    .select("modulo_id")
    .eq("id", aulaId)
    .maybeSingle();
  if (erroAula) return { erro: ERRO_MOVER };
  if (!aula) return { erro: ERRO_ID };

  const { data: irmas, error: erroIrmas } = await supabase
    .from("aulas")
    .select("id, ordem")
    .eq("modulo_id", aula.modulo_id);
  if (erroIrmas) return { erro: ERRO_MOVER };
  const resultado = await gravarOrdem(
    "aulas",
    (irmas ?? []) as ItemOrdenado[],
    aulaId,
    direcao,
  );
  atualizarTelas();
  return resultado;
}
