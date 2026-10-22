import { redirect } from "next/navigation";
import { connection } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export type Papel = "professor" | "aluno";

export type Sessao = {
  id: string;
  email: string;
  nome: string;
  papel: Papel;
};

export function destinoDoPapel(papel: Papel): string {
  return papel === "professor" ? "/professor" : "/cursos";
}

// Usuário logado com o perfil lido do banco (o papel nunca vem dos metadados).
// Só roda na hora da requisição: o Supabase compara a validade da sessão com
// o relógio (Date.now()), o que não pode acontecer na pré-renderização.
export async function obterSessao(): Promise<Sessao | null> {
  await connection();
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome, email, papel")
    .eq("id", user.id)
    .single();
  if (!perfil) return null;

  return {
    id: user.id,
    email: perfil.email,
    nome: perfil.nome,
    papel: perfil.papel as Papel,
  };
}

export async function exigirProfessor(): Promise<Sessao> {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");
  if (sessao.papel !== "professor") redirect(destinoDoPapel(sessao.papel));
  return sessao;
}

// Pergunta ao banco se o aluno logado já pode acessar (12 anos ou mais, ou
// menor com aceite do responsável). Em caso de erro, trata como bloqueado.
export async function alunoLiberado(): Promise<boolean> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("aluno_liberado");
  return !error && data === true;
}

// O menor de 12 sem aceite vai para a tela de espera.
export async function exigirAluno(): Promise<Sessao> {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");
  if (sessao.papel !== "aluno") redirect(destinoDoPapel(sessao.papel));
  if (!(await alunoLiberado())) redirect("/aguardando");
  return sessao;
}

// Telas do aluno: o aluno liberado estuda e o professor pré-visualiza.
export async function exigirAlunoOuProfessor(): Promise<Sessao> {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");
  if (sessao.papel === "aluno" && !(await alunoLiberado()))
    redirect("/aguardando");
  return sessao;
}
