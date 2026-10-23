import { redirect } from "next/navigation";
import { connection } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export type Papel = "professor" | "aluno";

export type Sessao = {
  id: string;
  email: string;
  // Nulo enquanto a pessoa não informa o nome (tela "Como você se chama?").
  nome: string | null;
  papel: Papel;
  bloqueado: boolean;
  // Entrou pelo Google sem cadastro do professor e ainda não foi liberado.
  pendente: boolean;
};

// Sessão de quem já informou o nome: o que as telas e ações recebem.
export type SessaoComNome = Sessao & { nome: string };

export const TELA_DO_NOME = "/seu-nome";

export function destinoDoPapel(papel: Papel): string {
  return papel === "professor" ? "/professor" : "/cursos";
}

// Quem ainda não informou o nome passa antes pela tela do nome.
export function destinoDaSessao(
  sessao: Pick<Sessao, "nome" | "papel">,
): string {
  return sessao.nome === null ? TELA_DO_NOME : destinoDoPapel(sessao.papel);
}

function comNome(sessao: Sessao): SessaoComNome {
  if (sessao.nome === null) redirect(TELA_DO_NOME);
  return sessao as SessaoComNome;
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
    .select("nome, email, papel, bloqueado_em, liberado_em")
    .eq("id", user.id)
    .single();
  if (!perfil) return null;

  return {
    id: user.id,
    email: perfil.email,
    nome: perfil.nome,
    papel: perfil.papel as Papel,
    bloqueado: perfil.bloqueado_em !== null,
    pendente: perfil.papel === "aluno" && perfil.liberado_em === null,
  };
}

export async function exigirProfessor(): Promise<SessaoComNome> {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");
  if (sessao.papel !== "professor") redirect(destinoDaSessao(sessao));
  return comNome(sessao);
}

// Pergunta ao banco se o aluno logado já pode acessar (liberado pelo professor
// e com 12 anos ou mais, ou menor com aceite do responsável). Em caso de erro,
// trata como bloqueado.
export async function alunoLiberado(): Promise<boolean> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("aluno_liberado");
  return !error && data === true;
}

// O aluno bloqueado vai para o aviso de bloqueio; quem não informou o nome,
// para a tela do nome; o pedido pendente e o menor de 12 sem aceite, para a
// tela de espera.
//
// Com { semNome: true }, só para a tela do nome: aceita quem está logado, sem
// bloqueio e ainda sem nome, mesmo pendente (o pedido só vai ao professor
// depois do nome). Quem já tem nome volta para a sua área.
export async function exigirAluno(): Promise<SessaoComNome>;
export async function exigirAluno(opcoes: { semNome: true }): Promise<Sessao>;
export async function exigirAluno(opcoes?: { semNome: true }): Promise<Sessao> {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");
  if (opcoes?.semNome) {
    if (sessao.bloqueado) redirect("/bloqueado");
    if (sessao.nome !== null) redirect(destinoDaSessao(sessao));
    return sessao;
  }
  if (sessao.papel !== "aluno") redirect(destinoDaSessao(sessao));
  if (sessao.bloqueado) redirect("/bloqueado");
  const comONome = comNome(sessao);
  if (!(await alunoLiberado())) redirect("/aguardando");
  return comONome;
}

// Telas do aluno: o aluno liberado estuda e o professor pré-visualiza.
export async function exigirAlunoOuProfessor(): Promise<SessaoComNome> {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");
  if (sessao.papel === "aluno" && sessao.bloqueado) redirect("/bloqueado");
  const comONome = comNome(sessao);
  if (sessao.papel === "aluno" && !(await alunoLiberado()))
    redirect("/aguardando");
  return comONome;
}
