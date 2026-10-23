import "server-only";
import { criarClienteServidor } from "@/lib/supabase/servidor";

// Ids das aulas que o usuário concluiu (registros sem conteúdo = aula inteira).
// O professor não tem progresso próprio, então recebe um conjunto vazio.
export async function aulasConcluidas(alunoId: string): Promise<Set<string>> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("progresso")
    .select("aula_id")
    .eq("aluno_id", alunoId)
    .is("conteudo_id", null);
  return new Set((data ?? []).map((linha) => linha.aula_id as string));
}

// Aula do registro de progresso mais recente do usuário, para o "Continue de
// onde parou". Nula quando ainda não há progresso (e sempre para o professor).
export async function ultimaAulaEstudada(
  alunoId: string,
): Promise<string | null> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("progresso")
    .select("aula_id")
    .eq("aluno_id", alunoId)
    .order("concluido_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.aula_id as string | undefined) ?? null;
}
