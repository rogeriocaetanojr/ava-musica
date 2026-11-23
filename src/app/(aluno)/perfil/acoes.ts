"use server";

import { exigirAluno } from "@/lib/auth";
import { type EstadoDoMeuNome, gravarMeuNome } from "@/lib/meu-nome";

export async function salvarNomeDoAluno(
  _estado: EstadoDoMeuNome,
  formData: FormData,
): Promise<EstadoDoMeuNome> {
  await exigirAluno();
  return gravarMeuNome(formData);
}
