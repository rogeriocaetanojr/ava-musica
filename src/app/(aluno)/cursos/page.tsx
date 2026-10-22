import Link from "next/link";
import { Suspense } from "react";
import { BarraProgresso } from "@/components/barra-progresso";
import { BotaoSair } from "@/components/botao-sair";
import { exigirAlunoOuProfessor } from "@/lib/auth";
import { type ModuloDoCurso, resumoDoCurso } from "@/lib/progresso";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { aulasConcluidas } from "../dados";
import {
  avisoPreVisualizacao,
  botaoPrincipal,
  botaoSecundario,
} from "../estilos";

type Curso = {
  id: string;
  titulo: string;
  instrumento: string;
  nivel: string | null;
  modulos: ModuloDoCurso[];
};

async function ListaDeCursos() {
  const sessao = await exigirAlunoOuProfessor();
  const professor = sessao.papel === "professor";

  // A RLS já limita o aluno aos cursos publicados em que está matriculado;
  // o filtro de publicado vale para a pré-visualização do professor.
  const supabase = await criarClienteServidor();
  const [{ data }, concluidas] = await Promise.all([
    supabase
      .from("cursos")
      .select(
        "id, titulo, instrumento, nivel, modulos (id, ordem, aulas (id, ordem, publicada))",
      )
      .eq("publicado", true)
      .order("titulo"),
    aulasConcluidas(sessao.id),
  ]);
  const cursos = (data ?? []) as unknown as Curso[];

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold break-words">Olá, {sessao.nome}</h1>
        {professor && (
          <Link href="/professor" className="text-base underline">
            Voltar ao painel
          </Link>
        )}
      </header>

      {professor && (
        <p className={avisoPreVisualizacao}>
          Pré-visualização: você vê os cursos publicados como um aluno, sem
          registrar progresso.
        </p>
      )}

      <h2 className="text-xl font-semibold">Meus cursos</h2>
      {cursos.length === 0 ? (
        <p className="text-lg">
          Você ainda não está matriculado em nenhum curso publicado.
        </p>
      ) : (
        <ul className="space-y-4">
          {cursos.map((curso) => {
            const resumo = resumoDoCurso(curso.modulos, concluidas);
            const destino = resumo.proxima
              ? `/aulas/${resumo.proxima.id}`
              : `/cursos/${curso.id}`;
            return (
              <li
                key={curso.id}
                className="space-y-4 rounded-lg border border-current/30 p-4"
              >
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold break-words">
                    <Link href={`/cursos/${curso.id}`} className="underline">
                      {curso.titulo}
                    </Link>
                  </h3>
                  <p className="text-base">
                    {curso.instrumento}
                    {curso.nivel ? ` · ${curso.nivel}` : ""} ·{" "}
                    {resumo.concluidas} de {resumo.total}{" "}
                    {resumo.total === 1 ? "aula" : "aulas"}
                  </p>
                </div>
                <BarraProgresso
                  percentual={resumo.percentual}
                  rotulo={`Progresso em ${curso.titulo}`}
                />
                {resumo.total > 0 && (
                  <Link
                    href={destino}
                    className={
                      resumo.proxima ? botaoPrincipal : botaoSecundario
                    }
                  >
                    {!resumo.proxima
                      ? "Rever o curso"
                      : resumo.concluidas === 0
                        ? "Começar"
                        : "Continuar"}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <BotaoSair />
    </>
  );
}

export default function MeusCursos() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <Suspense fallback={<p>Carregando…</p>}>
        <ListaDeCursos />
      </Suspense>
    </main>
  );
}
