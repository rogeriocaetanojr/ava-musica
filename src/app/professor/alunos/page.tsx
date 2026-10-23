import Link from "next/link";
import { Suspense } from "react";
import { Aviso } from "@/components/aviso";
import { exigirProfessor } from "@/lib/auth";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { FormularioAluno } from "./formulario-aluno";
import { PedidosDeAcesso } from "./pedidos-de-acesso";
import { RecusadosRecentes } from "./recusados-recentes";
import { CORES_DOS_STATUS, NOMES_DOS_STATUS, statusDoAluno } from "./validacao";

type Aluno = {
  id: string;
  nome: string;
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

async function ListaDeAlunos() {
  await exigirProfessor();

  const supabase = await criarClienteServidor();
  const [{ data: alunos }, { data: cursos }, acessos] = await Promise.all([
    supabase
      .from("perfis")
      .select(
        "id, nome, email, menor_de_12, bloqueado_em, liberado_em, responsaveis (aceito_em), matriculas (curso_id)",
      )
      .eq("papel", "aluno")
      // A conta criada pelo pedido de código e nunca confirmada não é de ninguém.
      .or("liberado_em.not.is.null,pedido_em.not.is.null")
      .order("nome"),
    supabase.from("cursos").select("id, titulo, publicado").order("titulo"),
    ultimosAcessos(),
  ]);
  const lista = (alunos ?? []) as unknown as Aluno[];

  return (
    <>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Turma</h2>
        {lista.length === 0 ? (
          <p>Nenhum aluno cadastrado ainda.</p>
        ) : (
          <ul className="space-y-3">
            {lista.map((aluno) => {
              const status = statusDoAluno({
                bloqueado: aluno.bloqueado_em !== null,
                pendente: aluno.liberado_em === null,
                menor_de_12: aluno.menor_de_12,
                aceito: Boolean(aluno.responsaveis?.aceito_em),
                ultimo_acesso: acessos.get(aluno.id),
              });
              const cursosDoAluno = aluno.matriculas.length;
              return (
                <li key={aluno.id}>
                  <Link
                    href={`/professor/alunos/${aluno.id}`}
                    className="block space-y-1 rounded-md border border-current p-3 hover:bg-current/5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium break-words">
                        {aluno.nome}
                      </span>
                      <span
                        className={`rounded px-2 py-1 text-xs font-medium ${CORES_DOS_STATUS[status]}`}
                      >
                        {NOMES_DOS_STATUS[status]}
                      </span>
                    </div>
                    <p className="text-sm break-all">{aluno.email}</p>
                    <p className="text-sm">
                      {cursosDoAluno} {cursosDoAluno === 1 ? "curso" : "cursos"}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Novo aluno</h2>
        <FormularioAluno cursos={cursos ?? []} />
      </section>
    </>
  );
}

// Quem pediu acesso (pelo Google ou pelo e-mail) e ainda espera liberação, do
// mais antigo ao mais novo. A conta criada e nunca confirmada fica de fora.
async function Pedidos() {
  await exigirProfessor();

  const supabase = await criarClienteServidor();
  const { data: pedidos, error } = await supabase
    .from("perfis")
    .select("id, nome, email, pedido_em")
    .eq("papel", "aluno")
    .is("liberado_em", null)
    .not("pedido_em", "is", null)
    .order("pedido_em");
  if (error || !pedidos)
    return (
      <Aviso role="alert">
        Não foi possível carregar os pedidos de acesso.
      </Aviso>
    );
  return <PedidosDeAcesso pedidos={pedidos} />;
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
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8">
      <Link href="/professor" className="text-sm underline">
        ← Painel
      </Link>
      <h1 className="text-2xl font-bold">Alunos</h1>
      <Suspense>
        <Pedidos />
      </Suspense>
      <section
        aria-labelledby="recusados-recentes"
        className="space-y-4 rounded-3xl border border-linha bg-superficie p-6"
      >
        <h2 id="recusados-recentes" className="font-titulo text-2xl text-texto">
          Recusados recentemente
        </h2>
        <Suspense fallback={<p>Carregando…</p>}>
          <Recusados />
        </Suspense>
      </section>
      <Suspense fallback={<p>Carregando…</p>}>
        <ListaDeAlunos />
      </Suspense>
    </main>
  );
}
