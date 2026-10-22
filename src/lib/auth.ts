import { redirect } from "next/navigation";
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
export async function obterSessao(): Promise<Sessao | null> {
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

export async function exigirAluno(): Promise<Sessao> {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");
  if (sessao.papel !== "aluno") redirect(destinoDoPapel(sessao.papel));
  return sessao;
}
