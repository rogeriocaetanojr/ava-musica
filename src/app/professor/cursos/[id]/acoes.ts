"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

// Botão do cabeçalho da página do curso: publica ou despublica só o curso.
export async function publicarCurso(
  cursoId: string,
  publicado: boolean,
): Promise<ResultadoDaAcao> {
  await exigirProfessor();
  if (!ehUuid(cursoId) || typeof publicado !== "boolean")
    return { erro: ERRO_ID };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("cursos")
    .update({ publicado })
    .eq("id", cursoId);
  if (error)
    return {
      erro: publicado
        ? "Não foi possível publicar o curso. Tente de novo."
        : "Não foi possível despublicar o curso. Tente de novo.",
    };
  atualizarTelas();
  return {};
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

// A troca de ordem é feita pelo banco (mover_item), numa transação só: dois
// cliques seguidos esperam um pelo outro e a lista nunca fica pela metade.
async function moverNoBanco(
  tabela: "modulos" | "aulas",
  id: string,
  direcao: Direcao,
): Promise<ResultadoDaAcao> {
  if (!ehUuid(id) || !ehDirecao(direcao)) return { erro: ERRO_ID };
  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("mover_item", {
    tabela,
    item: id,
    direcao,
  });
  atualizarTelas();
  if (error) return { erro: error.code === "P0002" ? ERRO_ID : ERRO_MOVER };
  return {};
}

export async function moverModulo(
  moduloId: string,
  direcao: Direcao,
): Promise<ResultadoDaAcao> {
  await exigirProfessor();
  return moverNoBanco("modulos", moduloId, direcao);
}

export async function moverAula(
  aulaId: string,
  direcao: Direcao,
): Promise<ResultadoDaAcao> {
  await exigirProfessor();
  return moverNoBanco("aulas", aulaId, direcao);
}

// O banco (excluir_item) apaga e grava a auditoria juntos; a cascata leva
// módulos, aulas, blocos e o progresso dos alunos, e no curso também as
// matrículas e os recados dele.
async function excluirNoBanco(
  tabela: "cursos" | "modulos" | "aulas",
  id: string,
): Promise<ResultadoDaAcao> {
  if (!ehUuid(id)) return { erro: ERRO_ID };
  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("excluir_item", { tabela, item: id });
  if (error)
    return {
      erro:
        error.code === "P0002"
          ? ERRO_ID
          : "Não foi possível excluir. Tente de novo.",
    };
  return {};
}

export async function excluirModulo(
  moduloId: string,
): Promise<ResultadoDaAcao> {
  await exigirProfessor();
  const resultado = await excluirNoBanco("modulos", moduloId);
  atualizarTelas();
  return resultado;
}

export async function excluirAula(aulaId: string): Promise<ResultadoDaAcao> {
  await exigirProfessor();
  const resultado = await excluirNoBanco("aulas", aulaId);
  atualizarTelas();
  return resultado;
}

export async function excluirCurso(cursoId: string): Promise<ResultadoDaAcao> {
  await exigirProfessor();
  const resultado = await excluirNoBanco("cursos", cursoId);
  if (resultado.erro) return resultado;
  revalidatePath("/professor/cursos");
  revalidatePath("/professor");
  redirect("/professor/cursos");
}
