import { redirect } from "next/navigation";
import { cache } from "react";
import { connection } from "next/server";
import { ehBloqueado } from "@/app/login/mensagens";
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

type ClienteServidor = Awaited<ReturnType<typeof criarClienteServidor>>;

function lerPerfil(supabase: ClienteServidor, id: string) {
  return supabase
    .from("perfis")
    .select("nome, email, papel, bloqueado_em, liberado_em")
    .eq("id", id)
    .maybeSingle();
}

// Usuário logado com o perfil lido do banco (o papel nunca vem dos metadados).
// Só roda na hora da requisição: o Supabase compara a validade da sessão com
// o relógio (Date.now()), o que não pode acontecer na pré-renderização.
// Memoizada por requisição (React.cache): o layout, a página e os componentes
// que pedem a sessão dividem uma ida só ao Auth e uma leitura do perfil.
//
// Velocidade: o servidor fica longe do banco, então cada ida conta. O id do
// token (getClaims, conferido localmente com a chave pública, sem rede) serve
// só para já pedir o perfil junto com o getUser, numa ida em vez de duas.
// Quem confirma o usuário continua sendo o getUser: se ele falhar ou trouxer
// outro id, o perfil adiantado é descartado. A RLS do perfil vale do mesmo
// jeito, pois a leitura usa o mesmo token.
export const obterSessao = cache(async (): Promise<Sessao | null> => {
  await connection();
  const supabase = await criarClienteServidor();
  const { data: doToken } = await supabase.auth.getClaims();
  const idDoToken = doToken?.claims.sub;

  const [
    {
      data: { user },
      error,
    },
    adiantado,
  ] = await Promise.all([
    supabase.auth.getUser(),
    idDoToken ? lerPerfil(supabase, idDoToken) : null,
  ]);
  // Conta bloqueada com o JWT ainda válido: o proxy (getClaims) não vê o ban,
  // mas o Auth recusa aqui. O login com o aviso apaga os cookies (proxy).
  if (ehBloqueado(error)) redirect("/login?erro=bloqueado");
  if (!user) return null;

  const { data: perfil } =
    adiantado && user.id === idDoToken
      ? adiantado
      : await lerPerfil(supabase, user.id);
  if (!perfil) return null;

  return {
    id: user.id,
    email: perfil.email,
    nome: perfil.nome,
    papel: perfil.papel as Papel,
    bloqueado: perfil.bloqueado_em !== null,
    pendente: perfil.papel === "aluno" && perfil.liberado_em === null,
  };
});

export async function exigirProfessor(): Promise<SessaoComNome> {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");
  if (sessao.papel !== "professor") redirect(destinoDaSessao(sessao));
  return comNome(sessao);
}

// Pergunta ao banco se o aluno logado já pode acessar (liberado pelo professor
// e com 12 anos ou mais, ou menor com aceite do responsável). Em caso de erro,
// trata como bloqueado. Memoizada por requisição, como obterSessao.
export const alunoLiberado = cache(async (): Promise<boolean> => {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("aluno_liberado");
  return !error && data === true;
});

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
  // A pergunta da liberação sai junto com a da sessão (uma ida em vez de
  // duas); a resposta só é usada depois que a sessão foi confirmada.
  const [sessao, liberado] = await Promise.all([
    obterSessao(),
    opcoes?.semNome ? true : alunoLiberado(),
  ]);
  if (!sessao) redirect("/login");
  if (opcoes?.semNome) {
    if (sessao.bloqueado) redirect("/bloqueado");
    if (sessao.nome !== null) redirect(destinoDaSessao(sessao));
    return sessao;
  }
  if (sessao.papel !== "aluno") redirect(destinoDaSessao(sessao));
  if (sessao.bloqueado) redirect("/bloqueado");
  const comONome = comNome(sessao);
  if (!liberado) redirect("/aguardando");
  return comONome;
}

// Telas do aluno: o aluno liberado estuda e o professor pré-visualiza.
// Como em exigirAluno, a liberação é perguntada junto com a sessão; para o
// professor a resposta é ignorada.
export async function exigirAlunoOuProfessor(): Promise<SessaoComNome> {
  const [sessao, liberado] = await Promise.all([
    obterSessao(),
    alunoLiberado(),
  ]);
  if (!sessao) redirect("/login");
  if (sessao.papel === "aluno" && sessao.bloqueado) redirect("/bloqueado");
  const comONome = comNome(sessao);
  if (sessao.papel === "aluno" && !liberado) redirect("/aguardando");
  return comONome;
}
