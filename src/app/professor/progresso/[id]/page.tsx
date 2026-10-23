import Link from "next/link";
import { TelaDoProfessor } from "@/components/tela-do-professor";
import { CONTEINER } from "@/components/conteiner";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BarraProgresso } from "@/components/barra-progresso";
import { exigirProfessor } from "@/lib/auth";
import { formatarDataHora } from "@/lib/datas";
import { ordenar } from "@/lib/ordem";
import { resumoParaProfessor, ultimaAtividade } from "@/lib/painel";
import { ehUuid } from "../../cursos/validacao";
import { dadosDoPainel } from "../dados";

async function DetalheDoAluno({ params }: { params: Promise<{ id: string }> }) {
  await exigirProfessor();
  const { id } = await params;
  if (!ehUuid(id)) notFound();

  const dados = await dadosDoPainel(id);
  if (!dados)
    return (
      <p role="alert" className="rounded-md bg-red-100 p-3 text-red-800">
        Não foi possível carregar o progresso do aluno.
      </p>
    );
  const aluno = dados.alunos[0];
  if (!aluno) notFound();

  // Quando cada aula foi concluída e cada prova marcada como enviada.
  const aulaConcluidaEm = new Map<string, string>();
  const provaEnviadaEm = new Map<string, string>();
  for (const r of dados.progresso)
    if (r.conteudo_id) provaEnviadaEm.set(r.conteudo_id, r.concluido_em);
    else aulaConcluidaEm.set(r.aula_id, r.concluido_em);

  const matriculados = new Set(aluno.matriculas.map((m) => m.curso_id));
  const cursos = dados.cursos.filter((c) => matriculados.has(c.id));
  const ultima = ultimaAtividade(dados.progresso);

  return (
    <>
      <header className="space-y-1">
        <h1 className="text-2xl font-bold break-words">{aluno.nome}</h1>
        <p className="text-sm">
          {ultima
            ? `Última atividade: ${formatarDataHora(ultima)}`
            : "Sem atividade ainda"}
        </p>
        <Link
          href={`/professor/alunos/${aluno.id}`}
          className="text-sm underline"
        >
          Ficha e matrículas
        </Link>
      </header>

      {cursos.length === 0 && (
        <p>O aluno não está matriculado em nenhum curso.</p>
      )}

      {cursos.map((curso) => {
        const resumo = resumoParaProfessor(curso.modulos, dados.progresso);
        return (
          <section key={curso.id} className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold break-words">
                {curso.titulo}
                {!curso.publicado && (
                  <span className="text-sm font-normal"> (rascunho)</span>
                )}
              </h2>
              <BarraProgresso
                percentual={resumo.percentual}
                rotulo={`Progresso em ${curso.titulo}`}
              />
            </div>

            {ordenar(curso.modulos).map((modulo) => {
              const aulas = ordenar(modulo.aulas.filter((a) => a.publicada));
              if (aulas.length === 0) return null;
              return (
                <div key={modulo.id} className="space-y-2">
                  <h3 className="font-medium break-words">{modulo.titulo}</h3>
                  <ul className="divide-y divide-current/20 rounded-md border border-current/30">
                    {aulas.map((aula) => {
                      const concluida = aulaConcluidaEm.get(aula.id);
                      const provas = aula.conteudos.filter(
                        (c) => c.tipo === "prova",
                      );
                      return (
                        <li key={aula.id} className="space-y-1 p-3">
                          <p className="break-words">{aula.titulo}</p>
                          <p
                            className={`text-sm ${concluida ? "text-sucesso" : ""}`}
                          >
                            {concluida
                              ? `Concluída em ${formatarDataHora(concluida)}`
                              : "Não concluída"}
                          </p>
                          {provas.map((prova, i) => {
                            const enviada = provaEnviadaEm.get(prova.id);
                            return (
                              <p key={prova.id} className="text-sm">
                                {provas.length > 1
                                  ? `Prova ${i + 1}: `
                                  : "Prova: "}
                                {enviada
                                  ? `enviada em ${formatarDataHora(enviada)}`
                                  : "não enviada"}
                              </p>
                            );
                          })}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
            {resumo.total === 0 && (
              <p className="text-sm">Nenhuma aula publicada.</p>
            )}
          </section>
        );
      })}
    </>
  );
}

export default function ProgressoDoAluno({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <TelaDoProfessor atual="alunos">
      <main
        className={`${CONTEINER} flex max-w-2xl flex-1 flex-col gap-8 py-8`}
      >
        <Link href="/professor" className="text-sm underline">
          ← Painel
        </Link>
        <Suspense fallback={<p>Carregando…</p>}>
          <DetalheDoAluno params={params} />
        </Suspense>
      </main>
    </TelaDoProfessor>
  );
}
