"use server";

import { exigirProfessor } from "@/lib/auth";
import { type EstadoDoMeuNome, gravarMeuNome } from "@/lib/meu-nome";

export async function salvarNomeDoProfessor(
  _estado: EstadoDoMeuNome,
  formData: FormData,
): Promise<EstadoDoMeuNome> {
  await exigirProfessor();
  return gravarMeuNome(formData);
}
