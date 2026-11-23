import "server-only";
import { revalidatePath } from "next/cache";
import { validarNome } from "@/lib/nomes";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export type EstadoDoMeuNome = { erro?: string; ok?: boolean; nome?: string };

// Grava o nome corrigido no Meu perfil pela função alterar_meu_nome, com a
// mesma validação da tela do nome. Quem chama já conferiu a sessão
// (exigirAluno ou exigirProfessor). O layout inteiro é revalidado para o
// nome novo aparecer no site todo.
export async function gravarMeuNome(
  formData: FormData,
): Promise<EstadoDoMeuNome> {
  const digitado = formData.get("nome");
  const resultado = validarNome(digitado);
  if (!resultado.ok)
    return {
      erro: resultado.erro,
      nome: typeof digitado === "string" ? digitado : "",
    };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("alterar_meu_nome", {
    p_nome: resultado.nome,
  });
  if (error)
    return {
      erro: "Não foi possível salvar o nome. Tente de novo.",
      nome: resultado.nome,
    };

  revalidatePath("/", "layout");
  return { ok: true, nome: resultado.nome };
}
