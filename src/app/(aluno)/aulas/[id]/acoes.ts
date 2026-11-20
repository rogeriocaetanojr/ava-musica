"use server";

import { revalidatePath } from "next/cache";
import type { ResultadoDaAcao } from "@/lib/acoes";
import { exigirAluno } from "@/lib/auth";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { ehUuid } from "../../../professor/cursos/validacao";

const ERRO_ID = "Aula não encontrada. Recarregue a página.";

function atualizarTelas() {
  revalidatePath("/cursos");
  revalidatePath("/cursos/[id]", "page");
  revalidatePath("/aulas/[id]", "page");
}

// Grava ou apaga um registro de progresso do aluno logado. A RLS garante que
// a aula é visível para ele e que o conteúdo pertence à aula. A tela mostra
// sempre o que está no banco: se a gravação falha, nada fica marcado e o
// aluno vê o erro.
async function registrar(
  aulaId: string,
  conteudoId: string | null,
  marcar: boolean,
  erro: string,
): Promise<ResultadoDaAcao> {
  const sessao = await exigirAluno();
  if (
    !ehUuid(aulaId) ||
    (conteudoId !== null && !ehUuid(conteudoId)) ||
    typeof marcar !== "boolean"
  )
    return { erro: ERRO_ID };

  const supabase = await criarClienteServidor();
  let resposta;
  if (marcar) {
    resposta = await supabase
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
    resposta = await (conteudoId === null
      ? consulta.is("conteudo_id", null)
      : consulta.eq("conteudo_id", conteudoId));
  }
  if (resposta.error) return { erro };

  atualizarTelas();
  return {};
}

export async function marcarAula(
  aulaId: string,
  concluida: boolean,
): Promise<ResultadoDaAcao> {
  return registrar(
    aulaId,
    null,
    concluida,
    concluida
      ? "Não foi possível marcar a aula como concluída. Tente de novo."
      : "Não foi possível desmarcar a aula. Tente de novo.",
  );
}

export async function marcarProva(
  aulaId: string,
  conteudoId: string,
  enviada: boolean,
): Promise<ResultadoDaAcao> {
  return registrar(
    aulaId,
    conteudoId,
    enviada,
    enviada
      ? "Não foi possível registrar o envio da prova. Tente de novo."
      : "Não foi possível desfazer o envio da prova. Tente de novo.",
  );
}
