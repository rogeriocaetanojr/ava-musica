import "server-only";
import type { Recado } from "@/components/sino-de-recados";
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

// Recados do professor, do mais novo para o mais antigo. A RLS já limita o
// aluno aos avisos gerais e aos dos cursos em que está matriculado.
export async function recadosDoAluno(): Promise<Recado[]> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("avisos")
    .select("id, titulo, texto, publicado_em, cursos (titulo)")
    .order("publicado_em", { ascending: false });
  return (data ?? []) as unknown as Recado[];
}
