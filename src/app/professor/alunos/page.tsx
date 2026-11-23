import { TelaDoProfessor } from "@/components/tela-do-professor";
import { CONTEINER } from "@/components/conteiner";
import { Suspense } from "react";
import { Aviso } from "@/components/aviso";
import { exigirProfessor } from "@/lib/auth";
import { nomeParaExibir } from "@/lib/nomes";
import { resumoParaProfessor } from "@/lib/painel";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { fotosDe } from "@/lib/fotos";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { contagemDe, dadosDoPainel } from "../progresso/dados";
import { type Pedido, PedidosDeAcesso } from "./pedidos-de-acesso";
import { RecusadosRecentes } from "./recusados-recentes";
import { type LinhaDaTurma, TabelaDeAlunos } from "./tabela-de-alunos";
import {
  CORES_DOS_STATUS,
  NOMES_DOS_STATUS,
  motivosDeAtencao,
  ORDEM_DOS_MOTIVOS,
  seloDoMotivo,
  type StatusDoAluno,
  statusDoAluno,
} from "./validacao";

type Aluno = {
  id: string;
  nome: string | null;
  email: string;
  menor_de_12: boolean;
  bloqueado_em: string | null;
  liberado_em: string | null;
  responsaveis: { aceito_em: string | null } | null;
  matriculas: { curso_id: string; criado_em: string }[];
};

// Último acesso de cada usuário, que só o Auth conhece. Lido com o cliente
// admin depois de exigirProfessor(); a turma cabe numa página só.
async function ultimosAcessos(): Promise<Map<string, string | null>> {
  const { data } = await criarClienteAdmin().auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  return new Map(
    (data?.users ?? []).map((u) => [u.id, u.last_sign_in_at ?? null]),
  );
}

const ORDEM_DA_SITUACAO: Record<StatusDoAluno, number> = {
  pendente: 0,
  convidado: 1,
  aguardando: 1,
  ativo: 2,
  bloqueado: 3,
};

async function ListaDeAlunos({ recusados }: { recusados: React.ReactNode }) {
  await exigirProfessor();

  const supabase = await criarClienteServidor();
  const [{ data: alunos }, acessos, painel, pedidos] = await Promise.all([
    supabase
      .from("perfis")
      .select(
        "id, nome, email, menor_de_12, bloqueado_em, liberado_em, responsaveis (aceito_em), matriculas (curso_id, criado_em)",
      )
      .eq("papel", "aluno")
      // A conta criada em Criar conta e nunca confirmada não é de ninguém.
      .or("liberado_em.not.is.null,pedido_em.not.is.null")
      .order("nome"),
    ultimosAcessos(),
    // Só leitura, para o progresso de cada matrícula.
    dadosDoPainel(),
    pedidosDeAcesso(),
  ]);
  const lista = (alunos ?? []) as unknown as Aluno[];
  const fotos = await fotosDe(lista.map((aluno) => aluno.id));
  const cursos = new Map((painel?.cursos ?? []).map((c) => [c.id, c]));

  // Quem está pendente já aparece em Pedidos de acesso, então fica fora da turma.
  const linhas: LinhaDaTurma[] = lista.flatMap((aluno) => {
    const status = statusDoAluno({
      bloqueado: aluno.bloqueado_em !== null,
      pendente: aluno.liberado_em === null,
      menor_de_12: aluno.menor_de_12,
      aceito: Boolean(aluno.responsaveis?.aceito_em),
      ultimo_acesso: acessos.get(aluno.id),
    });
    if (status === "pendente") return [];
    // Última aula concluída do aluno, em qualquer curso (progresso_por_curso).
    const ultimaAtividade =
      (painel?.contagens ?? [])
        .filter((c) => c.aluno_id === aluno.id && c.ultima_aula_em)
        .map((c) => c.ultima_aula_em as string)
        .sort()
        .at(-1) ?? null;
    const motivos = motivosDeAtencao({
      status,
      matriculas: aluno.matriculas.map((m) => m.criado_em),
      ultimaAtividade,
    });
    return [
      {
        id: aluno.id,
        nome: nomeParaExibir(aluno.nome),
        email: aluno.email,
        foto: fotos.get(aluno.id) ?? null,
        status,
        atencao: motivos.length > 0,
        // Prioridade do motivo principal, para ordenar "Precisam de atenção".
        prioridade:
          motivos.length > 0 ? ORDEM_DOS_MOTIVOS.indexOf(motivos[0].tipo) : 0,
        // Os selos dos motivos, lado a lado; sem motivo, o da situação.
        etiquetas:
          motivos.length > 0
            ? motivos.map(seloDoMotivo)
            : [
                {
                  texto: NOMES_DOS_STATUS[status],
                  classe: CORES_DOS_STATUS[status],
                },
              ],
        cursos: aluno.matriculas.flatMap(({ curso_id }) => {
          const curso = cursos.get(curso_id);
          if (!curso) return [];
          return [
            {
              id: curso.id,
              titulo: curso.titulo,
              percentual: painel
                ? resumoParaProfessor(
                    curso.modulos,
                    contagemDe(painel.contagens, aluno.id, curso.id),
                  ).percentual
                : null,
            },
          ];
        }),
      },
    ];
  });

  // Primeiro quem pede atenção, pelo motivo mais prioritário; depois os
  // ativos e, por último, os bloqueados; dentro de cada grupo, pelo nome.
  const grupo = (l: LinhaDaTurma) =>
    l.atencao ? 0 : ORDEM_DA_SITUACAO[l.status];
  linhas.sort(
    (a, b) =>
      grupo(a) - grupo(b) ||
      a.prioridade - b.prioridade ||
      a.nome.localeCompare(b.nome, "pt-BR"),
  );

  return (
    <TabelaDeAlunos
      linhas={linhas}
      quantidadeDePedidos={pedidos?.length ?? null}
      pedidos={
        pedidos ? (
          <PedidosDeAcesso pedidos={pedidos} />
        ) : (
          <Aviso role="alert">
            Não foi possível carregar os pedidos de acesso.
          </Aviso>
        )
      }
      recusados={recusados}
    />
  );
}

// Quem pediu acesso (pelo Google ou pelo e-mail) e ainda espera liberação, do
// mais antigo ao mais novo. A conta criada e nunca confirmada fica de fora.
// Nulo quando a leitura falha.
async function pedidosDeAcesso(): Promise<Pedido[] | null> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("perfis")
    .select("id, nome, email, pedido_em, data_nascimento")
    .eq("papel", "aluno")
    .is("liberado_em", null)
    .not("pedido_em", "is", null)
    .not("nome", "is", null)
    .order("pedido_em");
  if (error || !data) return null;
  return data as Pedido[];
}

async function Recusados() {
  await exigirProfessor();

  const supabase = await criarClienteServidor();
  const { data: recusas, error } = await supabase.rpc(
    "listar_recusas_recentes",
  );
  if (error || !recusas)
    return (
      <Aviso role="alert">Não foi possível carregar as recusas recentes.</Aviso>
    );
  return <RecusadosRecentes recusas={recusas} />;
}

// Alunos: cabeçalho com a busca, o filtro e os botões dos painéis de
// pedidos e recusados; a turma na largura toda.
export default function Alunos() {
  return (
    <TelaDoProfessor atual="alunos">
      <main
        className={`${CONTEINER} flex max-w-6xl flex-1 flex-col gap-5 py-6 md:py-10`}
      >
        <Suspense fallback={<p>Carregando…</p>}>
          <ListaDeAlunos
            recusados={
              <Suspense fallback={<p>Carregando…</p>}>
                <Recusados />
              </Suspense>
            }
          />
        </Suspense>
      </main>
    </TelaDoProfessor>
  );
}
