import "server-only";
import type { AulaComProvas, RegistroDeProgresso } from "@/lib/painel";
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
  matriculas: { curso_id: string }[];
};
export type ProgressoDoPainel = RegistroDeProgresso & { aluno_id: string };

// Tudo o que o painel precisa, lido com a sessão do professor (a RLS libera
// tudo para ele). alunoId limita a leitura a um aluno, na tela de detalhe.
export async function dadosDoPainel(alunoId?: string) {
  const supabase = await criarClienteServidor();

  let alunos = supabase
    .from("perfis")
    .select("id, nome, matriculas (curso_id)")
    .eq("papel", "aluno")
    .order("nome");
  let progresso = supabase
    .from("progresso")
    .select("aluno_id, aula_id, conteudo_id, concluido_em");
  if (alunoId) {
    alunos = alunos.eq("id", alunoId);
    progresso = progresso.eq("aluno_id", alunoId);
  }

  const [r1, r2, r3] = await Promise.all([
    alunos,
    supabase
      .from("cursos")
      .select(
        "id, titulo, publicado, modulos (id, titulo, ordem, aulas (id, titulo, ordem, publicada, conteudos (id, tipo)))",
      )
      .order("titulo"),
    progresso,
  ]);
  if (r1.error || r2.error || r3.error) return null;

  return {
    alunos: r1.data as unknown as AlunoDoPainel[],
    cursos: r2.data as unknown as CursoDoPainel[],
    progresso: r3.data as ProgressoDoPainel[],
  };
}
