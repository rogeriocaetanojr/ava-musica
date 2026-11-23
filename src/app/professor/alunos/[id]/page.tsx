import { FormularioDeAcao } from "@/components/formulario-de-acao";
import { LinhaDeVoltar } from "@/components/linha-de-voltar";
import { TelaDoProfessor } from "@/components/tela-do-professor";
import { CONTEINER } from "@/components/conteiner";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { BarraProgresso } from "@/components/barra-progresso";
import { exigirProfessor } from "@/lib/auth";
import { codigoDoAluno } from "@/lib/embeds";
import {
  type AcaoAuditada,
  NOMES_DAS_ACOES,
  registrarAcesso,
} from "@/lib/auditoria";
import { calcularIdade, hojeNoBrasil } from "@/lib/idade";
import { nomeParaExibir } from "@/lib/nomes";
import { Avatar } from "@/components/avatar";
import { fotoDe } from "@/lib/fotos";
import { ordenar } from "@/lib/ordem";
import { resumoParaProfessor, ultimaAtividade } from "@/lib/painel";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { ehUuid } from "../../cursos/validacao";
import { contagemDe, dadosDoPainel } from "../../progresso/dados";
import { desmatricular } from "../acoes";
import { BotaoLinkDeAceite } from "../botao-link-de-aceite";
import { BotaoReenviar } from "../botao-reenviar";
import { MatricularEmCurso, MenuDaFicha } from "./acoes-da-ficha";
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
    aceito_em: string | null;
    expira_em: string | null;
  } | null;
  matriculas: { curso_id: string }[];
};
type Curso = { id: string; titulo: string; publicado: boolean };
type Acesso = { id: number; acao: AcaoAuditada; criado_em: string };

const cartao = "rounded-3xl border border-linha bg-superficie p-4 md:p-5";
const tituloDeCartao = "font-titulo text-xl text-texto";
const rotuloDoDado = "text-xs font-bold text-texto-secundario";
// Estado vazio: uma linha cinza.
const vazio = "text-sm text-texto-secundario";

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

  // Pedido de acesso não tem ficha: quem ainda não foi liberado é resolvido
  // no painel de Pedidos de acesso, que já abre aberto. Conferido antes de
  // registrar o acesso, para não auditar uma ficha que não é mostrada.
  const supabase = await criarClienteServidor();
  const { data: liberacao } = await supabase
    .from("perfis")
    .select("liberado_em")
    .eq("id", id)
    .eq("papel", "aluno")
    .maybeSingle();
  if (!liberacao) notFound();
  if (liberacao.liberado_em === null)
    redirect("/professor/alunos?pedidos=abrir");

  // Menor de 18: sem o registro do acesso, a ficha não é mostrada.
  if (!(await registrarAcesso("abrir", id)))
    throw new Error("Não foi possível registrar o acesso à ficha do aluno.");

  const [
    { data },
    { data: cursos },
    { data: usuario },
    { data: acessos },
    painel,
    foto,
  ] = await Promise.all([
    supabase
      .from("perfis")
      .select(
        "id, nome, email, data_nascimento, menor_de_12, bloqueado_em, liberado_em, responsaveis (nome, email, aceito_em, expira_em), matriculas (curso_id)",
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
      .limit(20),
    // Só leitura, para o progresso de cada matrícula.
    dadosDoPainel(id),
    fotoDe(id),
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
      resumoParaProfessor(
        curso.modulos,
        painel && contagemDe(painel.contagens, id, curso.id),
      ).percentual,
    ]),
  );
  const registros = painel?.registros ?? [];
  const ultima = ultimaAtividade(registros);
  // Quando cada aula foi concluída e cada prova marcada como enviada.
  const aulaConcluidaEm = new Map<string, string>();
  const provaEnviadaEm = new Map<string, string>();
  for (const r of registros)
    if (r.conteudo_id) provaEnviadaEm.set(r.conteudo_id, r.concluido_em);
    else aulaConcluidaEm.set(r.aula_id, r.concluido_em);
  const cursosMatriculados = (painel?.cursos ?? []).filter((c) =>
    matriculados.has(c.id),
  );
  const listaDeAcessos = (acessos ?? []) as Acesso[];
  // Só a chave de serviço grava app_metadata: a marca do cadastro pelo
  // professor não pode ser forjada pelo aluno.
  const porConvite = usuario?.user?.app_metadata?.origem === "professor";

  return (
    <>
      {/* Cabeçalho: voltar, avatar, nome e selo; à direita, as ações
          principais: Matricular em curso e o menu "⋯" (Editar nome,
          Bloquear, Excluir). Pedido pendente não chega aqui. */}
      <LinhaDeVoltar href="/professor/alunos" rotulo="Voltar para Alunos">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar
              foto={foto}
              className="size-14 bg-linha text-texto-secundario"
            />
            <div className="min-w-0 space-y-1">
              <h1 className="font-titulo text-3xl break-all text-texto md:break-words">
                {nome}
              </h1>
              <span
                className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold ${CORES_DOS_STATUS[status]}`}
              >
                {NOMES_DOS_STATUS[status]}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:shrink-0">
            <MatricularEmCurso
              alunoId={aluno.id}
              cursos={((cursos ?? []) as Curso[]).filter(
                (c) => !matriculados.has(c.id),
              )}
            />
            <MenuDaFicha
              alunoId={aluno.id}
              nome={nome}
              nomeCadastrado={aluno.nome ?? ""}
              bloqueado={aluno.bloqueado_em !== null}
            />
          </div>
        </div>
      </LinhaDeVoltar>

      <div className="grid gap-5 lg:grid-cols-[20rem_1fr] lg:items-start">
        <div className="flex flex-col gap-5">
          <section aria-labelledby="dados" className={`${cartao} space-y-3`}>
            <h2 id="dados" className={tituloDeCartao}>
              Dados
            </h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className={rotuloDoDado}>E-mail</dt>
                <dd className="break-all text-texto">{aluno.email}</dd>
              </div>
              {aluno.data_nascimento && (
                <div>
                  <dt className={rotuloDoDado}>Idade</dt>
                  <dd className="text-texto">
                    {calcularIdade(aluno.data_nascimento, hojeNoBrasil())} anos
                    (nascimento em {formatarData(aluno.data_nascimento)})
                  </dd>
                </div>
              )}
              {/* O Forms recebe este código no lugar do e-mail (ver lib/embeds.ts). */}
              <div>
                <dt className={rotuloDoDado}>Código nas provas</dt>
                <dd className="font-mono text-texto">
                  {codigoDoAluno(aluno.id)}
                </dd>
              </div>
              <div>
                <dt className={rotuloDoDado}>Última atividade</dt>
                <dd className="text-texto">
                  {ultima ? formatarDataHora(ultima) : "Sem atividade ainda"}
                </dd>
              </div>
              <div>
                <dt className={rotuloDoDado}>Como entrou</dt>
                <dd className="text-texto">
                  {porConvite ? "Convite do professor" : "Pedido de acesso"}
                </dd>
              </div>
              {aluno.bloqueado_em && (
                <div>
                  <dt className={rotuloDoDado}>Bloqueado desde</dt>
                  <dd className="text-texto">
                    {formatarDataHora(aluno.bloqueado_em)}
                  </dd>
                </div>
              )}
            </dl>
            {/* O menor de 12 também define a senha antes do aceite. */}
            {(status === "convidado" ||
              (status === "aguardando" && !usuario?.user?.last_sign_in_at)) && (
              <BotaoReenviar alunoId={aluno.id} />
            )}
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
                <p className="text-sm text-sucesso">
                  Autorizou o acesso em {formatarData(responsavel.aceito_em)}.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-texto-secundario">
                    {responsavel.expira_em &&
                    new Date(responsavel.expira_em) > new Date()
                      ? `Ainda não autorizou. O último link vale até ${formatarData(responsavel.expira_em)}; se o responsável não o tiver, gere outro e envie a ele.`
                      : "Ainda não autorizou. Gere o link de autorização e envie ao responsável."}
                  </p>
                  <BotaoLinkDeAceite alunoId={aluno.id} />
                </div>
              )}
            </section>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <section
            aria-labelledby="matriculas"
            className={`${cartao} space-y-3`}
          >
            <h2 id="matriculas" className={tituloDeCartao}>
              Matrículas
            </h2>
            {cursosMatriculados.length === 0 ? (
              <p className={vazio}>Nenhuma matrícula.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {cursosMatriculados.map((curso) => {
                  const percentual = progressoDoCurso.get(curso.id) ?? 0;
                  return (
                    <li
                      key={curso.id}
                      className="space-y-2 rounded-2xl border border-linha bg-fundo p-3"
                    >
                      <p className="font-bold break-words text-texto">
                        {curso.titulo}
                        {!curso.publicado && (
                          <span className="text-sm font-normal text-texto-secundario">
                            {" "}
                            (rascunho)
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <BarraProgresso
                            percentual={percentual}
                            rotulo={`Progresso de ${nome} em ${curso.titulo}`}
                            cor="bordo"
                            comTexto={false}
                            fina
                          />
                        </div>
                        <span className="w-9 text-right text-xs text-texto-secundario">
                          {percentual}%
                        </span>
                      </div>
                      <FormularioDeAcao
                        acao={desmatricular.bind(null, aluno.id, curso.id)}
                      >
                        <button
                          type="submit"
                          className="inline-flex min-h-10 cursor-pointer items-center text-sm text-texto-secundario underline hover:text-texto"
                        >
                          Desmatricular
                        </button>
                      </FormularioDeAcao>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section
            aria-labelledby="progresso-por-aula"
            className={`${cartao} space-y-3`}
          >
            <h2 id="progresso-por-aula" className={tituloDeCartao}>
              Progresso por aula
            </h2>
            {cursosMatriculados.length === 0 ? (
              <p className={vazio}>Sem cursos, sem progresso para mostrar.</p>
            ) : (
              cursosMatriculados.map((curso) => {
                const modulos = ordenar(curso.modulos)
                  .map((modulo) => ({
                    ...modulo,
                    aulas: ordenar(modulo.aulas.filter((a) => a.publicada)),
                  }))
                  .filter((modulo) => modulo.aulas.length > 0);
                return (
                  <div key={curso.id} className="space-y-2">
                    <h3 className="text-sm font-bold break-words text-texto">
                      {curso.titulo}
                    </h3>
                    {modulos.length === 0 && (
                      <p className={vazio}>Nenhuma aula publicada.</p>
                    )}
                    {modulos.map((modulo) => (
                      <div key={modulo.id} className="space-y-1">
                        <h4 className="text-xs font-bold break-words text-texto-secundario">
                          {modulo.titulo}
                        </h4>
                        <ul className="rounded-xl bg-fundo px-3 py-1">
                          {modulo.aulas.map((aula) => {
                            const concluida = aulaConcluidaEm.get(aula.id);
                            const provas = aula.conteudos.filter(
                              (c) => c.tipo === "prova",
                            );
                            return (
                              <li
                                key={aula.id}
                                className="flex flex-col gap-x-3 py-1.5 text-sm sm:flex-row sm:items-baseline sm:justify-between"
                              >
                                <span className="min-w-0 break-words text-texto">
                                  {aula.titulo}
                                </span>
                                <span className="shrink-0 text-xs">
                                  <span
                                    className={
                                      concluida
                                        ? "text-sucesso"
                                        : "text-texto-secundario"
                                    }
                                  >
                                    {concluida
                                      ? `Concluída em ${formatarDataHora(concluida)}`
                                      : "Não concluída"}
                                  </span>
                                  {provas.map((prova, i) => {
                                    const enviada = provaEnviadaEm.get(
                                      prova.id,
                                    );
                                    return (
                                      <span
                                        key={prova.id}
                                        className={
                                          enviada
                                            ? "text-sucesso"
                                            : "text-texto-secundario"
                                        }
                                      >
                                        {" · "}
                                        {provas.length > 1
                                          ? `Prova ${i + 1}: `
                                          : "Prova: "}
                                        {enviada
                                          ? `enviada em ${formatarDataHora(enviada)}`
                                          : "não enviada"}
                                      </span>
                                    );
                                  })}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </section>

          <section
            aria-labelledby="ultimos-acessos"
            className={`${cartao} space-y-3`}
          >
            <h2 id="ultimos-acessos" className={tituloDeCartao}>
              Últimos acessos
            </h2>
            {listaDeAcessos.length === 0 ? (
              <p className={vazio}>
                Nenhum acesso registrado (só os de alunos menores de 18 anos).
              </p>
            ) : (
              <>
                <ListaDeAcessos acessos={listaDeAcessos.slice(0, 5)} />
                {listaDeAcessos.length > 5 && (
                  <details className="group">
                    <summary className="inline-flex min-h-10 cursor-pointer items-center text-sm font-bold text-destaque underline group-open:hidden">
                      Ver mais ({listaDeAcessos.length - 5})
                    </summary>
                    <ListaDeAcessos acessos={listaDeAcessos.slice(5)} />
                  </details>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function ListaDeAcessos({ acessos }: { acessos: Acesso[] }) {
  return (
    <ul className="text-sm">
      {acessos.map((acesso) => (
        <li
          key={acesso.id}
          className="flex flex-wrap justify-between gap-x-3 py-1"
        >
          <span className="text-texto">
            {NOMES_DAS_ACOES[acesso.acao] ?? acesso.acao}
          </span>
          <span className="text-xs text-texto-secundario">
            {formatarDataHora(acesso.criado_em)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function Aluno({ params }: { params: Promise<{ id: string }> }) {
  return (
    <TelaDoProfessor atual="alunos">
      <main
        className={`${CONTEINER} flex max-w-6xl flex-1 flex-col gap-6 py-6 md:py-10`}
      >
        <Suspense
          fallback={
            <>
              <LinhaDeVoltar
                href="/professor/alunos"
                rotulo="Voltar para Alunos"
              />
              <p>Carregando…</p>
            </>
          }
        >
          <FichaDoAluno params={params} />
        </Suspense>
      </main>
    </TelaDoProfessor>
  );
}
