import Link from "next/link";
import { Suspense } from "react";
import { BarraProgresso } from "@/components/barra-progresso";
import { BotaoSair } from "@/components/botao-sair";
import { exigirProfessor } from "@/lib/auth";
import { formatarDataHora } from "@/lib/datas";
import { resumoParaProfessor, ultimaAtividade } from "@/lib/painel";
import { dadosDoPainel } from "./progresso/dados";

async function ProgressoDaTurma() {
  await exigirProfessor();

  const dados = await dadosDoPainel();
  if (!dados)
    return (
      <p role="alert" className="rounded-md bg-red-100 p-3 text-red-800">
        Não foi possível carregar o progresso dos alunos.
      </p>
    );
  if (dados.alunos.length === 0) return <p>Nenhum aluno cadastrado ainda.</p>;

  const cursoPorId = new Map(dados.cursos.map((c) => [c.id, c]));

  return (
    <ul className="space-y-3">
      {dados.alunos.map((aluno) => {
        const registros = dados.progresso.filter(
          (r) => r.aluno_id === aluno.id,
        );
        const ultima = ultimaAtividade(registros);
        const cursos = aluno.matriculas
          .map((m) => cursoPorId.get(m.curso_id))
          .filter((c) => c !== undefined)
          .sort((a, b) => a.titulo.localeCompare(b.titulo));
        return (
          <li key={aluno.id}>
            <Link
              href={`/professor/progresso/${aluno.id}`}
              className="block space-y-3 rounded-md border border-current p-4 hover:bg-current/5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium break-words">{aluno.nome}</span>
                <span className="text-sm">
                  {ultima
                    ? `Última atividade: ${formatarDataHora(ultima)}`
                    : "Sem atividade ainda"}
                </span>
              </div>
              {cursos.length === 0 ? (
                <p className="text-sm">Sem matrículas.</p>
              ) : (
                <ul className="space-y-3">
                  {cursos.map((curso) => {
                    const resumo = resumoParaProfessor(
                      curso.modulos,
                      registros,
                    );
                    return (
                      <li key={curso.id} className="space-y-1">
                        <p className="text-sm break-words">
                          <span className="font-medium">{curso.titulo}</span>
                          {!curso.publicado && " (rascunho)"} ·{" "}
                          {resumo.concluidas} de {resumo.total}{" "}
                          {resumo.total === 1 ? "aula" : "aulas"}
                          {resumo.provas > 0 &&
                            ` · ${resumo.provasEnviadas} de ${resumo.provas} ${resumo.provas === 1 ? "prova enviada" : "provas enviadas"}`}
                        </p>
                        <BarraProgresso
                          percentual={resumo.percentual}
                          rotulo={`Progresso de ${aluno.nome} em ${curso.titulo}`}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

async function Painel() {
  const sessao = await exigirProfessor();

  return (
    <>
      <h1 className="text-2xl font-bold">Olá, {sessao.nome}</h1>
      <nav className="flex flex-wrap gap-x-6 gap-y-2">
        <Link href="/professor/cursos" className="underline">
          Cursos, módulos e aulas
        </Link>
        <Link href="/professor/alunos" className="underline">
          Alunos e matrículas
        </Link>
        <Link href="/professor/avisos" className="underline">
          Avisos
        </Link>
        <Link href="/cursos" className="underline">
          Ver como aluno
        </Link>
      </nav>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Progresso dos alunos</h2>
        <Suspense fallback={<p>Carregando…</p>}>
          <ProgressoDaTurma />
        </Suspense>
      </section>

      <BotaoSair />
    </>
  );
}

export default function PainelProfessor() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <Suspense>
        <Painel />
      </Suspense>
    </main>
  );
}
