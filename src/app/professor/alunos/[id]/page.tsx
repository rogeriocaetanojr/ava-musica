import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { exigirProfessor } from "@/lib/auth";
import {
  type AcaoAuditada,
  NOMES_DAS_ACOES,
  registrarAcesso,
} from "@/lib/auditoria";
import { calcularIdade, hojeNoBrasil } from "@/lib/idade";
import { urlDoSite } from "@/lib/site";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { ehUuid } from "../../cursos/validacao";
import { desmatricular, matricular } from "../acoes";
import { BotaoBloqueio } from "../botao-bloqueio";
import { BotaoCopiar } from "../botao-copiar";
import { BotaoReenviar } from "../botao-reenviar";
import { FormularioExclusao } from "../formulario-exclusao";
import {
  CORES_DOS_STATUS,
  NOMES_DOS_STATUS,
  statusDoAluno,
} from "../validacao";

type Aluno = {
  id: string;
  nome: string;
  email: string;
  data_nascimento: string | null;
  menor_de_12: boolean;
  bloqueado_em: string | null;
  responsaveis: {
    nome: string;
    email: string;
    token: string;
    aceito_em: string | null;
  } | null;
  matriculas: { curso_id: string }[];
};
type Curso = { id: string; titulo: string; publicado: boolean };
type Acesso = { id: number; acao: AcaoAuditada; criado_em: string };

const botaoPequeno =
  "shrink-0 rounded-md border border-current px-3 py-2 text-sm";

function formatarDataHora(data: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

function formatarData(data: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: data.length === 10 ? "UTC" : "America/Sao_Paulo",
  }).format(new Date(data));
}

async function FichaDoAluno({ params }: { params: Promise<{ id: string }> }) {
  await exigirProfessor();
  const { id } = await params;
  if (!ehUuid(id)) notFound();
  // Menor de 18: sem o registro do acesso, a ficha não é mostrada.
  if (!(await registrarAcesso("abrir", id)))
    throw new Error("Não foi possível registrar o acesso à ficha do aluno.");

  const supabase = await criarClienteServidor();
  const [{ data }, { data: cursos }, { data: usuario }, { data: acessos }] =
    await Promise.all([
      supabase
        .from("perfis")
        .select(
          "id, nome, email, data_nascimento, menor_de_12, bloqueado_em, responsaveis (nome, email, token, aceito_em), matriculas (curso_id)",
        )
        .eq("id", id)
        .eq("papel", "aluno")
        .maybeSingle(),
      supabase.from("cursos").select("id, titulo, publicado").order("titulo"),
      criarClienteAdmin().auth.admin.getUserById(id),
      supabase
        .from("auditoria")
        .select("id, acao, criado_em")
        .eq("aluno_id", id)
        .order("criado_em", { ascending: false })
        .limit(10),
    ]);
  if (!data) notFound();

  const aluno = data as unknown as Aluno;
  const responsavel = aluno.responsaveis;
  const status = statusDoAluno({
    bloqueado: aluno.bloqueado_em !== null,
    menor_de_12: aluno.menor_de_12,
    aceito: Boolean(responsavel?.aceito_em),
    ultimo_acesso: usuario?.user?.last_sign_in_at,
  });
  const matriculados = new Set(aluno.matriculas.map((m) => m.curso_id));

  return (
    <>
      <header className="space-y-2">
        <h1 className="text-2xl font-bold break-words">{aluno.nome}</h1>
        <span
          className={`inline-block rounded px-2 py-1 text-xs font-medium ${CORES_DOS_STATUS[status]}`}
        >
          {NOMES_DOS_STATUS[status]}
        </span>
        <dl className="space-y-1 text-sm">
          <div>
            <dt className="inline font-medium">E-mail: </dt>
            <dd className="inline break-all">{aluno.email}</dd>
          </div>
          {aluno.data_nascimento && (
            <div>
              <dt className="inline font-medium">Nascimento: </dt>
              <dd className="inline">
                {formatarData(aluno.data_nascimento)} (
                {calcularIdade(aluno.data_nascimento, hojeNoBrasil())} anos)
              </dd>
            </div>
          )}
        </dl>
        {status === "convidado" && <BotaoReenviar alunoId={aluno.id} />}
      </header>

      {responsavel && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Responsável</h2>
          <p className="text-sm break-words">
            {responsavel.nome} · {responsavel.email}
          </p>
          {responsavel.aceito_em ? (
            <p className="text-sm">
              Autorizou o acesso em {formatarData(responsavel.aceito_em)}.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm">
                Ainda não autorizou. Envie este link ao responsável:
              </p>
              <BotaoCopiar
                texto={urlDoSite(`/aceite/${responsavel.token}`)}
                rotulo="Link de autorização do responsável"
              />
            </div>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Matrículas</h2>
        {(cursos ?? []).length === 0 ? (
          <p>Nenhum curso criado ainda.</p>
        ) : (
          <ul className="space-y-2">
            {((cursos ?? []) as Curso[]).map((curso) => {
              const matriculado = matriculados.has(curso.id);
              return (
                <li
                  key={curso.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-current/30 p-3"
                >
                  <span className="min-w-0 break-words">
                    {curso.titulo}
                    {!curso.publicado && (
                      <span className="text-sm"> (rascunho)</span>
                    )}
                    {matriculado && (
                      <span className="block text-sm text-sucesso">
                        Matriculado
                      </span>
                    )}
                  </span>
                  <form
                    action={(matriculado ? desmatricular : matricular).bind(
                      null,
                      aluno.id,
                      curso.id,
                    )}
                  >
                    <button type="submit" className={botaoPequeno}>
                      {matriculado ? "Desmatricular" : "Matricular"}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Últimos acessos</h2>
        {(acessos ?? []).length === 0 ? (
          <p className="text-sm">
            Nenhum acesso registrado. Só são registrados os acessos aos dados de
            alunos menores de 18 anos.
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {((acessos ?? []) as Acesso[]).map((acesso) => (
              <li key={acesso.id}>
                {formatarDataHora(acesso.criado_em)} ·{" "}
                {NOMES_DAS_ACOES[acesso.acao] ?? acesso.acao}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Acesso</h2>
        {aluno.bloqueado_em && (
          <p className="text-sm">
            Bloqueado desde {formatarDataHora(aluno.bloqueado_em)}.
          </p>
        )}
        <BotaoBloqueio
          alunoId={aluno.id}
          nome={aluno.nome}
          bloqueado={aluno.bloqueado_em !== null}
        />
      </section>

      <section className="space-y-3 rounded-md border border-red-700 p-4">
        <h2 className="text-xl font-semibold">Excluir todos os dados</h2>
        <FormularioExclusao alunoId={aluno.id} nome={aluno.nome} />
      </section>
    </>
  );
}

export default function Aluno({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8">
      <Link href="/professor/alunos" className="text-sm underline">
        ← Alunos
      </Link>
      <Suspense fallback={<p>Carregando…</p>}>
        <FichaDoAluno params={params} />
      </Suspense>
    </main>
  );
}
