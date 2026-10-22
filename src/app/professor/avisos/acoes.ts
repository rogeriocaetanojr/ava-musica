"use server";

import { revalidatePath } from "next/cache";
import { exigirProfessor } from "@/lib/auth";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import {
  ehUuid,
  type EstadoFormulario,
  valoresDigitados,
} from "../cursos/validacao";
import { validarAviso } from "./validacao";

const ERRO_ID = "Aviso não encontrado. Recarregue a página.";
const ERRO_BANCO = "Não foi possível salvar o aviso. Tente de novo.";

function atualizarTelas() {
  revalidatePath("/professor/avisos");
  revalidatePath("/cursos");
}

export async function criarAviso(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await exigirProfessor();

  const resultado = validarAviso(formData);
  if (!resultado.ok)
    return { erro: resultado.erro, valores: resultado.valores };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("avisos").insert(resultado.dados);
  if (error) return { erro: ERRO_BANCO, valores: valoresDigitados(formData) };

  atualizarTelas();
  // valores vazios limpam o formulário para o próximo aviso.
  return { sucesso: "Aviso publicado.", valores: {} };
}

export async function editarAviso(
  avisoId: string,
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await exigirProfessor();
  if (!ehUuid(avisoId)) return { erro: ERRO_ID };

  const resultado = validarAviso(formData);
  if (!resultado.ok)
    return { erro: resultado.erro, valores: resultado.valores };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("avisos")
    .update(resultado.dados)
    .eq("id", avisoId);
  if (error) return { erro: ERRO_BANCO, valores: valoresDigitados(formData) };

  atualizarTelas();
  return { sucesso: "Aviso salvo.", valores: valoresDigitados(formData) };
}

export async function apagarAviso(avisoId: string): Promise<void> {
  await exigirProfessor();
  if (!ehUuid(avisoId)) return;

  const supabase = await criarClienteServidor();
  await supabase.from("avisos").delete().eq("id", avisoId);
  atualizarTelas();
}
