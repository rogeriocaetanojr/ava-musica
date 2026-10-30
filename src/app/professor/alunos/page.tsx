import Link from "next/link";
import { BotaoVoltar } from "@/components/botao-voltar";
import { TelaDoProfessor } from "@/components/tela-do-professor";
import { CONTEINER } from "@/components/conteiner";
import { Suspense } from "react";
import { Aviso } from "@/components/aviso";
import { exigirProfessor } from "@/lib/auth";
import { nomeParaExibir } from "@/lib/nomes";
import { resumoParaProfessor } from "@/lib/painel";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { dadosDoPainel } from "../progresso/dados";
import { GavetaDePedidos } from "./gaveta-de-pedidos";
import { PedidosDeAcesso } from "./pedidos-de-acesso";
import { RecusadosRecentes } from "./recusados-recentes";
import { type LinhaDaTurma, TabelaDeAlunos } from "./tabela-de-alunos";
import { CORES_DOS_STATUS, NOMES_DOS_STATUS, statusDoAluno } from "./validacao";

type Aluno = {
  id: string;
  nome: string | null;
  email: string;
  menor_de_12: boolean;
  bloqueado_em: string | null;
  liberado_em: string | null;
  responsaveis: { aceito_em: string | null } | null;
  matriculas: { curso_id: string }[];
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

// Cores dos avatares, alternadas pela ordem da lista, como no painel.
const AVATARES = [
  "bg-bordo text-amarelo",
  "bg-amarelo text-texto-sobre-amarelo",
  "bg-bloco text-texto-sobre-bloco",
  "bg-vinho text-amarelo-claro",
];

async function ListaDeAlunos({ pedidos }: { pedidos: React.ReactNode }) {
  await exigirProfessor();

  const supabase = await criarClienteServidor();
  const [{ data: alunos }, acessos, painel] = await Promise.all([
    supabase
      .from("perfis")
      .select(
        "id, nome, email, menor_de_12, bloqueado_em, liberado_em, responsaveis (aceito_em), matriculas (curso_id)",
      )
      .eq("papel", "aluno")
      // A conta criada pelo pedido de código e nunca confirmada não é de ninguém.
      .or("liberado_em.not.is.null,pedido_em.not.is.null")
      .order("nome"),
    ultimosAcessos(),
    // Só leitura, para o progresso de cada matrícula.
    dadosDoPainel(),
  ]);
  const lista = (alunos ?? []) as unknown as Aluno[];
  const cursos = new Map((painel?.cursos ?? []).map((c) => [c.id, c]));

  // Quem está pendente já aparece em Pedidos de acesso, então fica fora da turma.
  const linhas: LinhaDaTurma[] = lista.flatMap((aluno, indice) => {
    const status = statusDoAluno({
      bloqueado: aluno.bloqueado_em !== null,
      pendente: aluno.liberado_em === null,
      menor_de_12: aluno.menor_de_12,
      aceito: Boolean(aluno.responsaveis?.aceito_em),
      ultimo_acesso: acessos.get(aluno.id),
    });
    if (status === "pendente") return [];
    const registros = (painel?.progresso ?? []).filter(
      (r) => r.aluno_id === aluno.id,
    );
    return [
      {
        id: aluno.id,
        nome: nomeParaExibir(aluno.nome),
        email: aluno.email,
        avatar: AVATARES[indice % AVATARES.length],
        etiqueta: {
          texto: NOMES_DOS_STATUS[status],
          classe: CORES_DOS_STATUS[status],
        },
        cursos: aluno.matriculas.flatMap(({ curso_id }) => {
          const curso = cursos.get(curso_id);
          if (!curso) return [];
          return [
            {
              id: curso.id,
              titulo: curso.titulo,
              percentual: painel
                ? resumoParaProfessor(curso.modulos, registros).percentual
                : null,
            },
          ];
        }),
      },
    ];
  });

  return <TabelaDeAlunos linhas={linhas} pedidos={pedidos} />;
}

// Quem pediu acesso (pelo Google ou pelo e-mail) e ainda espera liberação, do
// mais antigo ao mais novo. A conta criada e nunca confirmada fica de fora.
async function Pedidos({ recusados }: { recusados: React.ReactNode }) {
  await exigirProfessor();

  const supabase = await criarClienteServidor();
  const { data: pedidos, error } = await supabase
    .from("perfis")
    .select("id, nome, email, pedido_em")
    .eq("papel", "aluno")
    .is("liberado_em", null)
    .not("pedido_em", "is", null)
    .not("nome", "is", null)
    .order("pedido_em");
  if (error || !pedidos)
    return (
      <GavetaDePedidos
        quantidade={null}
        pedidos={
          <Aviso role="alert">
            Não foi possível carregar os pedidos de acesso.
          </Aviso>
        }
        recusados={recusados}
      />
    );
  return (
    <GavetaDePedidos
      quantidade={pedidos.length}
      pedidos={<PedidosDeAcesso pedidos={pedidos} />}
      recusados={recusados}
    />
  );
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

export default function Alunos() {
  return (
    <TelaDoProfessor atual="alunos">
      <main
        className={`${CONTEINER} flex max-w-6xl flex-1 flex-col gap-6 py-6 md:gap-8 md:py-10`}
      >
        <div className="md:hidden">
          <BotaoVoltar href="/professor" rotulo="Voltar para Painel" />
        </div>
        <Link
          href="/professor"
          className="hidden min-h-12 items-center self-start text-sm font-bold text-destaque underline md:inline-flex"
        >
          ← Painel
        </Link>
        <Suspense fallback={<p>Carregando…</p>}>
          <ListaDeAlunos
            pedidos={
              <Suspense>
                <Pedidos
                  recusados={
                    <section
                      aria-labelledby="recusados-recentes"
                      className="space-y-4 rounded-3xl border border-linha bg-superficie p-5"
                    >
                      <h2
                        id="recusados-recentes"
                        className="font-titulo text-2xl text-texto"
                      >
                        Recusados recentemente
                      </h2>
                      <Suspense fallback={<p>Carregando…</p>}>
                        <Recusados />
                      </Suspense>
                    </section>
                  }
                />
              </Suspense>
            }
          />
        </Suspense>
      </main>
    </TelaDoProfessor>
  );
}
