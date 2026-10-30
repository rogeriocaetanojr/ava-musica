import Link from "next/link";
import { BotaoVoltar } from "@/components/botao-voltar";
import { TelaDoAluno } from "@/components/tela-do-aluno";
import { CONTEINER } from "@/components/conteiner";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BarraProgresso } from "@/components/barra-progresso";
import { classesDoBotao } from "@/components/botao";
import { BocaDoViolao, Cordas } from "@/components/cordas";
import {
  MarcadorDaAula,
  type Situacao,
  TEXTO_DA_SITUACAO,
} from "@/components/marcador-da-aula";
import { exigirAlunoOuProfessor } from "@/lib/auth";
import { ordenar } from "@/lib/ordem";
import {
  type ModuloDoCurso,
  aulasEmOrdem,
  resumoDoCurso,
} from "@/lib/progresso";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { ehUuid } from "../../../professor/cursos/validacao";
import { aulasConcluidas } from "../../dados";
import { avisoPreVisualizacao } from "../../estilos";

type Aula = {
  id: string;
  titulo: string;
  ordem: number;
  publicada: boolean;
  conteudos: { tipo: string }[];
};
type Modulo = ModuloDoCurso<Aula> & { titulo: string };
type Curso = {
  id: string;
  titulo: string;
  instrumento: string;
  nivel: string | null;
  descricao: string | null;
  modulos: Modulo[];
};

const rotuloDeSecao = "text-sm font-bold text-destaque";

function temProva(aula: Aula): boolean {
  return aula.conteudos.some((conteudo) => conteudo.tipo === "prova");
}

async function PaginaDoCurso({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirAlunoOuProfessor();
  const { id } = await params;
  if (!ehUuid(id)) notFound();

  const supabase = await criarClienteServidor();
  const [{ data }, concluidas] = await Promise.all([
    supabase
      .from("cursos")
      .select(
        "id, titulo, instrumento, nivel, descricao, modulos (id, titulo, ordem, aulas (id, titulo, ordem, publicada, conteudos (tipo)))",
      )
      .eq("id", id)
      .eq("publicado", true)
      .maybeSingle(),
    aulasConcluidas(sessao.id),
  ]);
  if (!data) notFound();

  const curso = data as unknown as Curso;
  const resumo = resumoDoCurso(curso.modulos, concluidas);
  const sequencia = aulasEmOrdem(curso.modulos);

  // A aula atual é a próxima não concluída, a mesma do botão Continuar.
  function situacaoDe(aula: Aula): Situacao {
    if (concluidas.has(aula.id)) return "concluida";
    if (aula.id === resumo.proxima?.id) return "atual";
    if (temProva(aula)) return "prova";
    return "pendente";
  }

  return (
    <>
      <BotaoVoltar href="/cursos" rotulo="Voltar para Meus cursos" />

      {sessao.papel === "professor" && (
        <p className={avisoPreVisualizacao}>
          Pré-visualização do aluno. Rascunhos não aparecem.
        </p>
      )}

      <section
        aria-labelledby="titulo-do-curso"
        className="relative overflow-hidden rounded-3xl border border-borda-cartao bg-bordo p-6 text-sobre-bordo md:p-8 md:pr-56"
      >
        <Cordas className="absolute inset-y-0 right-4 w-16 md:right-14 md:w-26" />
        <BocaDoViolao className="absolute top-1/2 right-10 hidden size-32 -translate-y-1/2 md:block" />

        <div className="relative space-y-4">
          <p className="text-sm font-bold text-amarelo">
            {curso.instrumento}
            {curso.nivel ? ` · ${curso.nivel}` : ""}
          </p>
          <h1
            id="titulo-do-curso"
            className="pr-14 font-titulo text-3xl break-words md:pr-0 md:text-4xl"
          >
            {curso.titulo}
          </h1>
          {curso.descricao && (
            <p className="pr-14 text-base break-words whitespace-pre-wrap text-amarelo-claro md:pr-0">
              {curso.descricao}
            </p>
          )}
          {resumo.total > 0 && (
            <>
              <div className="flex max-w-md items-center gap-3 pr-14 md:pr-0">
                <div className="flex-1">
                  <BarraProgresso
                    percentual={resumo.percentual}
                    rotulo={`Progresso em ${curso.titulo}`}
                    cor="amarelo"
                    comTexto={false}
                  />
                </div>
                <span className="text-sm font-bold">{resumo.percentual}%</span>
              </div>
              <p className="pr-14 text-sm text-amarelo-claro md:pr-0">
                {resumo.proxima
                  ? `${resumo.concluidas} de ${resumo.total} ${resumo.total === 1 ? "aula concluída" : "aulas concluídas"}`
                  : "Curso concluído. Pode rever as aulas quando quiser."}
              </p>
            </>
          )}
          {resumo.proxima && (
            <Link
              href={`/aulas/${resumo.proxima.id}`}
              className={classesDoBotao("destaque", "md:w-auto")}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 12 12"
                className="size-3"
                fill="currentColor"
              >
                <path d="M2 1l9 5-9 5z" />
              </svg>
              {resumo.concluidas === 0 ? "Começar" : "Continuar"}
            </Link>
          )}
        </div>
      </section>

      {resumo.total === 0 ? (
        <p className="rounded-2xl border border-linha bg-superficie p-6 text-lg">
          Nenhuma aula ainda.
        </p>
      ) : (
        <section aria-labelledby="modulos" className="space-y-5">
          <h2 id="modulos" className={rotuloDeSecao}>
            Módulos
          </h2>
          <ol className="space-y-5">
            {ordenar(curso.modulos).map((modulo) => {
              const aulas = ordenar(
                modulo.aulas.filter((aula) => aula.publicada),
              );
              if (aulas.length === 0) return null;
              const quantidade = `${aulas.length} ${aulas.length === 1 ? "aula" : "aulas"}`;
              const listaDeAulas = (
                <ol className="space-y-1">
                  {aulas.map((aula) => {
                    const situacao = situacaoDe(aula);
                    const numero =
                      sequencia.findIndex((outra) => outra.id === aula.id) + 1;
                    const atual = situacao === "atual";
                    return (
                      <li key={aula.id}>
                        <Link
                          href={`/aulas/${aula.id}`}
                          className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 text-base ${
                            atual
                              ? "bg-bloco font-bold text-texto-sobre-bloco"
                              : "text-texto hover:bg-fundo"
                          }`}
                        >
                          <MarcadorDaAula situacao={situacao} numero={numero} />
                          <span className="min-w-0 break-words">
                            {temProva(aula)
                              ? aula.titulo
                              : `Aula ${numero} · ${aula.titulo}`}
                            <span className="sr-only">
                              {" "}
                              ({TEXTO_DA_SITUACAO[situacao]})
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              );
              const temAProxima = aulas.some(
                (aula) => aula.id === resumo.proxima?.id,
              );
              return (
                <li key={modulo.id}>
                  {/* No celular o módulo recolhe; abre o da próxima aula. */}
                  <details
                    open={temAProxima}
                    className="group rounded-2xl border border-linha bg-superficie md:hidden"
                  >
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0">
                        <span className="block font-titulo text-xl break-words text-texto">
                          {modulo.titulo}
                        </span>
                        <span className="block text-sm text-texto-secundario">
                          {quantidade}
                        </span>
                      </span>
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-5 shrink-0 text-texto transition-transform group-open:rotate-180"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </summary>
                    <div className="px-1 pb-3">{listaDeAulas}</div>
                  </details>

                  <div className="hidden space-y-3 rounded-2xl border border-linha bg-superficie p-4 md:block md:p-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 px-3">
                      <h3 className="font-titulo text-xl break-words text-texto md:text-2xl">
                        {modulo.titulo}
                      </h3>
                      <p className="text-sm text-texto-secundario">
                        {quantidade}
                      </p>
                    </div>
                    {listaDeAulas}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </>
  );
}

export default function Curso({ params }: { params: Promise<{ id: string }> }) {
  return (
    <TelaDoAluno atual="cursos">
      <main
        className={`${CONTEINER} flex max-w-6xl flex-1 flex-col gap-6 py-6 md:gap-8 md:py-10`}
      >
        <Suspense fallback={<p>Carregando…</p>}>
          <PaginaDoCurso params={params} />
        </Suspense>
      </main>
    </TelaDoAluno>
  );
}
