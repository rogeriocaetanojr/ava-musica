import Link from "next/link";
import { BotaoVoltar } from "@/components/botao-voltar";
import { TelaDoProfessor } from "@/components/tela-do-professor";
import { CONTEINER } from "@/components/conteiner";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BarraProgresso } from "@/components/barra-progresso";
import { exigirProfessor } from "@/lib/auth";
import {
  type AcaoAuditada,
  NOMES_DAS_ACOES,
  registrarAcesso,
} from "@/lib/auditoria";
import { calcularIdade, hojeNoBrasil } from "@/lib/idade";
import { iniciais, nomeParaExibir } from "@/lib/nomes";
import { resumoParaProfessor } from "@/lib/painel";
import { urlDoSite } from "@/lib/site";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { ehUuid } from "../../cursos/validacao";
import { dadosDoPainel } from "../../progresso/dados";
import { desmatricular, matricular } from "../acoes";
import { BotaoBloqueio } from "../botao-bloqueio";
import { BotaoCopiar } from "../botao-copiar";
import { BotaoReenviar } from "../botao-reenviar";
import { FormularioExclusao } from "../formulario-exclusao";
import { FormularioNome } from "../formulario-nome";
import {
  CORES_DOS_STATUS,
  NOMES_DOS_STATUS,
  statusDoAluno,
} from "../validacao";

type Aluno = {
  id: string;
  nome: string | null;
  email: string;
  data_nascimento: string | null;
  menor_de_12: boolean;
  bloqueado_em: string | null;
  liberado_em: string | null;
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

const cartao = "rounded-3xl border border-linha bg-superficie p-5 md:p-6";
const cartaoComLista =
  "overflow-hidden rounded-3xl border border-linha bg-superficie";
const tituloDeCartao = "font-titulo text-2xl text-texto";
const botaoPequeno =
  "inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl border border-linha bg-superficie px-4 text-sm font-bold text-texto hover:border-borda-campo";

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
  const [
    { data },
    { data: cursos },
    { data: usuario },
    { data: acessos },
    painel,
  ] = await Promise.all([
    supabase
      .from("perfis")
      .select(
        "id, nome, email, data_nascimento, menor_de_12, bloqueado_em, liberado_em, responsaveis (nome, email, token, aceito_em), matriculas (curso_id)",
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
    // Só leitura, para o progresso de cada matrícula.
    dadosDoPainel(id),
  ]);
  if (!data) notFound();

  const aluno = data as unknown as Aluno;
  const responsavel = aluno.responsaveis;
  const status = statusDoAluno({
    bloqueado: aluno.bloqueado_em !== null,
    pendente: aluno.liberado_em === null,
    menor_de_12: aluno.menor_de_12,
    aceito: Boolean(responsavel?.aceito_em),
    ultimo_acesso: usuario?.user?.last_sign_in_at,
  });
  const matriculados = new Set(aluno.matriculas.map((m) => m.curso_id));
  const nome = nomeParaExibir(aluno.nome);
  const progressoDoCurso = new Map(
    (painel?.cursos ?? []).map((curso) => [
      curso.id,
      resumoParaProfessor(curso.modulos, painel?.progresso ?? []).percentual,
    ]),
  );

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr] lg:items-start">
        <div className="flex flex-col gap-6">
          <header className={`${cartao} space-y-4`}>
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-bordo font-titulo text-xl text-amarelo"
              >
                {iniciais(nome)}
              </span>
              <div className="min-w-0 space-y-2">
                <h1 className="font-titulo text-3xl break-all text-texto md:break-words">
                  {nome}
                </h1>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${CORES_DOS_STATUS[status]}`}
                >
                  {NOMES_DOS_STATUS[status]}
                </span>
              </div>
            </div>
            <dl className="space-y-3 border-t border-linha pt-4 text-sm">
              {aluno.data_nascimento && (
                <div>
                  <dt className="text-xs font-bold text-texto-secundario">
                    Idade
                  </dt>
                  <dd className="text-texto">
                    {calcularIdade(aluno.data_nascimento, hojeNoBrasil())} anos
                    (nascimento em {formatarData(aluno.data_nascimento)})
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-bold text-texto-secundario">
                  E-mail
                </dt>
                <dd className="break-all text-texto">{aluno.email}</dd>
              </div>
            </dl>
            {status === "convidado" && <BotaoReenviar alunoId={aluno.id} />}
            {status === "pendente" && (
              <p className="text-sm text-texto-secundario">
                Pediu acesso pelo login.{" "}
                <Link
                  href="/professor"
                  className="font-bold text-bordo underline"
                >
                  Libere ou recuse no painel
                </Link>
                .
              </p>
            )}
          </header>

          <section aria-labelledby="nome" className={`${cartao} space-y-3`}>
            <h2 id="nome" className={tituloDeCartao}>
              Nome
            </h2>
            <FormularioNome alunoId={aluno.id} nome={aluno.nome ?? ""} />
          </section>

          {responsavel && (
            <section
              aria-labelledby="responsavel"
              className={`${cartao} space-y-3`}
            >
              <h2 id="responsavel" className={tituloDeCartao}>
                Responsável
              </h2>
              <p className="text-sm break-words text-texto">
                <span className="block font-bold">{responsavel.nome}</span>
                <span className="break-all text-texto-secundario">
                  {responsavel.email}
                </span>
              </p>
              {responsavel.aceito_em ? (
                <p className="rounded-xl bg-linha p-4 text-sm text-sucesso">
                  Autorizou o acesso em {formatarData(responsavel.aceito_em)}.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-texto-secundario">
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
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="matriculas" className={cartaoComLista}>
            <h2 id="matriculas" className={`${tituloDeCartao} px-6 pt-5 pb-3`}>
              Matrículas
            </h2>
            {(cursos ?? []).length === 0 ? (
              <p className="px-6 pb-6 text-texto-secundario">
                Nenhum curso criado ainda.
              </p>
            ) : (
              <ul className="divide-y divide-linha border-t border-linha">
                {((cursos ?? []) as Curso[]).map((curso) => {
                  const matriculado = matriculados.has(curso.id);
                  const percentual = progressoDoCurso.get(curso.id);
                  return (
                    <li
                      key={curso.id}
                      className="flex flex-col gap-3 px-5 py-4 md:flex-row md:flex-wrap md:items-center md:gap-4 md:px-6"
                    >
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="break-words text-texto">
                          <span className="font-bold">{curso.titulo}</span>
                          {!curso.publicado && (
                            <span className="text-sm text-texto-secundario">
                              {" "}
                              (rascunho)
                            </span>
                          )}
                        </p>
                        {matriculado ? (
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-sucesso">
                              Matriculado
                            </span>
                            {percentual !== undefined && (
                              <>
                                <div className="flex-1 md:max-w-64">
                                  <BarraProgresso
                                    percentual={percentual}
                                    rotulo={`Progresso de ${nome} em ${curso.titulo}`}
                                    cor="bordo"
                                    comTexto={false}
                                  />
                                </div>
                                <span className="text-sm text-texto">
                                  {percentual}%
                                </span>
                              </>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-texto-secundario">
                            Não matriculado
                          </p>
                        )}
                      </div>
                      <form
                        action={(matriculado ? desmatricular : matricular).bind(
                          null,
                          aluno.id,
                          curso.id,
                        )}
                        className="w-full md:w-auto"
                      >
                        <button
                          type="submit"
                          className={`${botaoPequeno} w-full md:w-auto`}
                        >
                          {matriculado ? "Desmatricular" : "Matricular"}
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="ultimos-acessos" className={cartaoComLista}>
            <h2
              id="ultimos-acessos"
              className={`${tituloDeCartao} px-6 pt-5 pb-3`}
            >
              Últimos acessos
            </h2>
            {(acessos ?? []).length === 0 ? (
              <p className="px-6 pb-6 text-sm text-texto-secundario">
                Nenhum acesso registrado. Só são registrados os acessos aos
                dados de alunos menores de 18 anos.
              </p>
            ) : (
              <ul className="divide-y divide-linha border-t border-linha text-sm">
                {((acessos ?? []) as Acesso[]).map((acesso) => (
                  <li
                    key={acesso.id}
                    className="flex flex-col gap-1 px-5 py-3 md:flex-row md:flex-wrap md:justify-between md:gap-2 md:px-6"
                  >
                    <span className="text-texto">
                      {NOMES_DAS_ACOES[acesso.acao] ?? acesso.acao}
                    </span>
                    <span className="text-texto-secundario">
                      {formatarDataHora(acesso.criado_em)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="acesso" className={`${cartao} space-y-3`}>
            <h2 id="acesso" className={tituloDeCartao}>
              Acesso
            </h2>
            {aluno.bloqueado_em && (
              <p className="text-sm font-bold text-texto">
                Bloqueado desde {formatarDataHora(aluno.bloqueado_em)}.
              </p>
            )}
            <BotaoBloqueio
              alunoId={aluno.id}
              nome={nome}
              bloqueado={aluno.bloqueado_em !== null}
            />
          </section>
        </div>
      </div>

      <section
        aria-labelledby="excluir"
        className="mt-4 space-y-3 rounded-3xl border-2 border-bordo bg-superficie p-5 md:p-6"
      >
        <h2 id="excluir" className="font-titulo text-2xl text-bordo">
          Excluir todos os dados
        </h2>
        <FormularioExclusao alunoId={aluno.id} nome={nome} />
      </section>
    </>
  );
}

export default function Aluno({ params }: { params: Promise<{ id: string }> }) {
  return (
    <TelaDoProfessor atual="alunos">
      <main
        className={`${CONTEINER} flex max-w-6xl flex-1 flex-col gap-6 py-6 md:py-10`}
      >
        <div className="md:hidden">
          <BotaoVoltar href="/professor/alunos" rotulo="Voltar para Alunos" />
        </div>
        <Link
          href="/professor/alunos"
          className="hidden min-h-12 items-center self-start text-sm font-bold text-bordo underline md:inline-flex"
        >
          ← Alunos
        </Link>
        <Suspense fallback={<p>Carregando…</p>}>
          <FichaDoAluno params={params} />
        </Suspense>
      </main>
    </TelaDoProfessor>
  );
}
