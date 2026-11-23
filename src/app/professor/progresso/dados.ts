import "server-only";
import { nomeParaExibir } from "@/lib/nomes";
import type {
  AulaComProvas,
  ContagemDoCurso,
  RegistroDeProgresso,
} from "@/lib/painel";
import type { ModuloDoCurso } from "@/lib/progresso";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export type AulaDoPainel = AulaComProvas & { titulo: string };
export type CursoDoPainel = {
  id: string;
  titulo: string;
  publicado: boolean;
  modulos: (ModuloDoCurso<AulaDoPainel> & { titulo: string })[];
};
export type AlunoDoPainel = {
  id: string;
  nome: string;
  // criado_em: quando foi matriculado (para o selo "Parado" do painel).
  matriculas: { curso_id: string; criado_em: string }[];
};
export type RegistroDoAluno = RegistroDeProgresso;

// A API do Supabase devolve no máximo 1000 linhas por consulta (max_rows).
const PAGINA = 1000;

// Todos os registros de progresso de um aluno, página por página, para as
// datas de cada aula e prova na ficha.
async function registrosDoAluno(
  supabase: Awaited<ReturnType<typeof criarClienteServidor>>,
  alunoId: string,
): Promise<RegistroDoAluno[] | null> {
  const registros: RegistroDoAluno[] = [];
  for (let inicio = 0; ; inicio += PAGINA) {
    const { data, error } = await supabase
      .from("progresso")
      .select("aula_id, conteudo_id, concluido_em")
      .eq("aluno_id", alunoId)
      .order("id")
      .range(inicio, inicio + PAGINA - 1);
    if (error) return null;
    registros.push(...(data as RegistroDoAluno[]));
    if (data.length < PAGINA) return registros;
  }
}

// Tudo o que o painel precisa, lido com a sessão do professor (a RLS libera
// tudo para ele). O progresso chega já contado pelo banco, uma linha por
// aluno e curso (progresso_por_curso). alunoId limita a leitura a um aluno,
// na ficha, que também recebe os registros um a um.
export async function dadosDoPainel(alunoId?: string) {
  const supabase = await criarClienteServidor();

  let alunos = supabase
    .from("perfis")
    .select("id, nome, matriculas (curso_id, criado_em)")
    .eq("papel", "aluno")
    .not("liberado_em", "is", null)
    .order("nome");
  if (alunoId) alunos = alunos.eq("id", alunoId);

  const [r1, r2, r3, registros] = await Promise.all([
    alunos,
    supabase
      .from("cursos")
      .select(
        "id, titulo, publicado, modulos (id, titulo, ordem, aulas (id, titulo, ordem, publicada, conteudos (id, tipo)))",
      )
      .order("titulo"),
    supabase.rpc("progresso_por_curso", alunoId ? { p_aluno: alunoId } : {}),
    alunoId ? registrosDoAluno(supabase, alunoId) : Promise.resolve([]),
  ]);
  if (r1.error || r2.error || r3.error || !registros) return null;

  return {
    alunos: (r1.data as unknown as AlunoDoPainel[]).map((aluno) => ({
      ...aluno,
      nome: nomeParaExibir(aluno.nome),
    })),
    cursos: r2.data as unknown as CursoDoPainel[],
    contagens: r3.data as ContagemDoCurso[],
    registros,
  };
}

// Contagem de um aluno num curso; indefinida quando ainda não há progresso.
export function contagemDe(
  contagens: readonly ContagemDoCurso[],
  alunoId: string,
  cursoId: string,
): ContagemDoCurso | undefined {
  return contagens.find(
    (c) => c.aluno_id === alunoId && c.curso_id === cursoId,
  );
}

export type SituacaoNoPainel = {
  id: string;
  menor_de_12: boolean;
  bloqueado_em: string | null;
  responsaveis: { aceito_em: string | null } | null;
};

// Bloqueio e aceite do responsável dos alunos liberados, para a situação de
// cada um e os indicadores do painel.
export async function situacaoDosAlunos() {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("perfis")
    .select("id, menor_de_12, bloqueado_em, responsaveis (aceito_em)")
    .eq("papel", "aluno")
    .not("liberado_em", "is", null);
  if (error) return null;
  return data as unknown as SituacaoNoPainel[];
}
