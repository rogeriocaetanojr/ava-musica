"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirProfessor } from "@/lib/auth";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import {
  type EstadoFormulario,
  validarCurso,
  valoresDigitados,
} from "./validacao";

export async function criarCurso(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await exigirProfessor();

  const resultado = validarCurso(formData);
  if (!resultado.ok)
    return { erro: resultado.erro, valores: resultado.valores };

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("cursos")
    .insert(resultado.dados)
    .select("id")
    .single();
  if (error || !data)
    return {
      erro: "Não foi possível criar o curso. Tente de novo.",
      valores: valoresDigitados(formData),
    };

  revalidatePath("/professor/cursos");
  redirect(`/professor/cursos/${data.id}`);
}
