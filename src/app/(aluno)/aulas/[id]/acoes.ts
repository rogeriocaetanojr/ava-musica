"use server";

import { revalidatePath } from "next/cache";
import { exigirAluno } from "@/lib/auth";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { ehUuid } from "../../../professor/cursos/validacao";

function atualizarTelas() {
  revalidatePath("/cursos");
  revalidatePath("/cursos/[id]", "page");
  revalidatePath("/aulas/[id]", "page");
}

// Grava ou apaga um registro de progresso do aluno logado. A RLS garante que
// a aula é visível para ele e que o conteúdo pertence à aula.
async function registrar(
  aulaId: string,
  conteudoId: string | null,
  marcar: boolean,
): Promise<void> {
  const sessao = await exigirAluno();
  if (
    !ehUuid(aulaId) ||
    (conteudoId !== null && !ehUuid(conteudoId)) ||
    typeof marcar !== "boolean"
  )
    return;

  const supabase = await criarClienteServidor();
  if (marcar) {
    await supabase
      .from("progresso")
      .upsert(
        { aluno_id: sessao.id, aula_id: aulaId, conteudo_id: conteudoId },
        { onConflict: "aluno_id,aula_id,conteudo_id", ignoreDuplicates: true },
      );
  } else {
    const consulta = supabase
      .from("progresso")
      .delete()
      .eq("aluno_id", sessao.id)
      .eq("aula_id", aulaId);
    await (conteudoId === null
      ? consulta.is("conteudo_id", null)
      : consulta.eq("conteudo_id", conteudoId));
  }
  atualizarTelas();
}

export async function marcarAula(
  aulaId: string,
  concluida: boolean,
): Promise<void> {
  await registrar(aulaId, null, concluida);
}

export async function marcarProva(
  aulaId: string,
  conteudoId: string,
  enviada: boolean,
): Promise<void> {
  await registrar(aulaId, conteudoId, enviada);
}
