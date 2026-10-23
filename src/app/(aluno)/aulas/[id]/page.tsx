import Link from "next/link";
import { LogoDoAva } from "@/components/logo-do-ava";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BarraProgresso } from "@/components/barra-progresso";
import { type Bloco } from "@/components/bloco-conteudo";
import { classesDoBotao } from "@/components/botao";
import { BotaoEnviar } from "@/components/botao-enviar";
import { Cordas } from "@/components/cordas";
import { MaterialDaAula } from "@/components/material-da-aula";
import { exigirAlunoOuProfessor } from "@/lib/auth";
import { lerConteudo } from "@/lib/embeds";
import { ordenar } from "@/lib/ordem";
import {
  aulasEmOrdem,
  percentualDeProgresso,
  type ModuloDoCurso,
} from "@/lib/progresso";

import { criarClienteServidor } from "@/lib/supabase/servidor";
import { ehUuid } from "../../../professor/cursos/validacao";
import { aulasConcluidas } from "../../dados";
import { marcarAula, marcarProva } from "./acoes";

type Conteudo = Bloco & { id: string; ordem: number };
type Aula = {
  id: string;
  titulo: string;
  publicada: boolean;
  modulos: {
    id: string;
    titulo: string;
    curso_id: string;
    cursos: { titulo: string; publicado: boolean };
  };
  conteudos: Conteudo[];
};
type AulaDoCurso = {
  id: string;
  titulo: string;
  ordem: number;
  publicada: boolean;
  conteudos: { tipo: string }[];
};
type Modulo = ModuloDoCurso<AulaDoCurso> & { titulo: string };

const VISTO = "M5 12.5l4.5 4.5L19 7.5";

function Visto({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={VISTO} />
    </svg>
  );
}

function BotaoProva({
  aulaId,
  conteudoId,
  enviada,
}: {
  aulaId: string;
  conteudoId: string;
  enviada: boolean;
}) {
  return (
    <form action={marcarProva.bind(null, aulaId, conteudoId, !enviada)}>
      {enviada && (
        <p className="mb-2 text-base font-semibold text-sucesso">
          ✓ Prova enviada
        </p>
      )}
      <BotaoEnviar
        className={classesDoBotao(
          enviada ? "secundario" : "primario",
          "sm:w-auto",
        )}
      >
        {enviada ? "Desfazer envio" : "Enviei a prova"}
      </BotaoEnviar>
    </form>
  );
}

type Situacao = "concluida" | "atual" | "prova" | "pendente";

function Marcador({
  situacao,
  numero,
}: {
  situacao: Situacao;
  numero: number;
}) {
  const base =
    "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold";
  switch (situacao) {
    case "concluida":
      return (
        <span className={`${base} bg-bordo text-amarelo`}>
          <Visto className="size-4" />
        </span>
      );
    case "atual":
      return (
        <span className={`${base} bg-amarelo text-texto-sobre-amarelo`}>
          {numero}
        </span>
      );
    case "prova":
      return (
        <span
          className={`${base} border-2 border-dashed border-borda-campo text-texto-secundario`}
        >
          <Visto className="size-3.5" />
        </span>
      );
    case "pendente":
      return (
        <span
          className={`${base} border-2 border-borda-campo text-texto-secundario`}
        >
          {numero}
        </span>
      );
  }
}

const TEXTO_DA_SITUACAO: Record<Situacao, string> = {
  concluida: "concluída",
  atual: "aula atual",
  prova: "prova",
  pendente: "pendente",
};

async function PaginaDaAula({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirAlunoOuProfessor();
  const aluno = sessao.papel === "aluno";
  const { id } = await params;
  if (!ehUuid(id)) notFound();

  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("aulas")
    .select(
      "id, titulo, publicada, modulos (id, titulo, curso_id, cursos (titulo, publicado)), conteudos (id, tipo, ordem, titulo, texto, url)",
    )
    .eq("id", id)
    .eq("publicada", true)
    .maybeSingle();
  const aula = data as unknown as Aula | null;
  // Para o aluno a RLS já esconde o curso não publicado; o professor
  // pré-visualiza só o que o aluno veria.
  if (!aula || !aula.modulos.cursos.publicado) notFound();

  const [{ data: modulos }, { data: progresso }, concluidasNoCurso] =
    await Promise.all([
      supabase
        .from("modulos")
        .select(
          "id, titulo, ordem, aulas (id, titulo, ordem, publicada, conteudos (tipo))",
        )
        .eq("curso_id", aula.modulos.curso_id),
      supabase
        .from("progresso")
        .select("conteudo_id")
        .eq("aluno_id", sessao.id)
        .eq("aula_id", aula.id),
      aulasConcluidas(sessao.id),
    ]);

  const listaDeModulos = (modulos ?? []) as unknown as Modulo[];
  const sequencia = aulasEmOrdem(listaDeModulos);
  const posicao = sequencia.findIndex((item) => item.id === aula.id);
  const anterior = posicao > 0 ? sequencia[posicao - 1] : null;
  const seguinte = posicao >= 0 ? (sequencia[posicao + 1] ?? null) : null;
  const feitas = sequencia.filter((item) =>
    concluidasNoCurso.has(item.id),
  ).length;
  const percentual = percentualDeProgresso(feitas, sequencia.length);
  const moduloAtual = listaDeModulos.find(
    (modulo) => modulo.id === aula.modulos.id,
  );
  const aulasDoModulo = moduloAtual ? aulasEmOrdem([moduloAtual]) : [];
  const numeroDoModulo =
    ordenar(listaDeModulos).findIndex(
      (modulo) => modulo.id === aula.modulos.id,
    ) + 1;

  const marcados = new Set(
    (progresso ?? []).map((linha) => linha.conteudo_id as string | null),
  );
  const concluida = marcados.has(null);
  const blocos = ordenar(aula.conteudos);
  // O primeiro vídeo abre a aula; os textos formam a descrição e o resto vira
  // os materiais, sempre na ordem do professor.
  const video = blocos.find(
    (bloco) =>
      bloco.tipo === "youtube" && lerConteudo("youtube", bloco.url ?? ""),
  );
  const lido = video ? lerConteudo("youtube", video.url ?? "") : null;
  const embedDoVideo = lido?.tipo === "youtube" ? lido : null;
  const textos = blocos.filter((bloco) => bloco.tipo === "texto");
  const materiais = blocos.filter(
    (bloco) => bloco.tipo !== "texto" && bloco !== video,
  );
  const curso = aula.modulos.cursos.titulo;
  const linkDoCurso = `/cursos/${aula.modulos.curso_id}`;

  function situacaoDe(item: AulaDoCurso): Situacao {
    if (concluidasNoCurso.has(item.id)) return "concluida";
    if (item.id === aula!.id) return "atual";
    if (item.conteudos.some((conteudo) => conteudo.tipo === "prova"))
      return "prova";
    return "pendente";
  }

  function listaDoModulo() {
    return (
      <ol className="space-y-1">
        {aulasDoModulo.map((item) => {
          const situacao = situacaoDe(item);
          const numero =
            sequencia.findIndex((outra) => outra.id === item.id) + 1;
          const prova = item.conteudos.some(
            (conteudo) => conteudo.tipo === "prova",
          );
          const atual = item.id === aula!.id;
          return (
            <li key={item.id}>
              <Link
                href={`/aulas/${item.id}`}
                aria-current={atual ? "page" : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 text-base ${
                  atual
                    ? "bg-amarelo-claro font-bold text-texto-sobre-amarelo"
                    : "text-texto hover:bg-fundo"
                }`}
              >
                <Marcador situacao={situacao} numero={numero} />
                <span className="min-w-0 break-words">
                  {prova ? item.titulo : `Aula ${numero} · ${item.titulo}`}
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
  }

  return (
    <>
      <header className="border-linha md:border-b md:bg-superficie">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-x-4 md:flex-wrap md:gap-x-6 gap-y-2 px-4 py-3">
          <Link
            href={linkDoCurso}
            aria-label={`Voltar para ${curso}`}
            className="grid size-12 shrink-0 place-items-center rounded-xl border border-linha bg-superficie text-texto hover:border-borda-campo"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
            >
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
          </Link>
          <div className="min-w-0 flex-1 md:hidden">
            <p className="text-base font-bold text-bordo">
              {numeroDoModulo > 0 && `Módulo ${numeroDoModulo}`}
              {numeroDoModulo > 0 && posicao >= 0 && " · "}
              {posicao >= 0 && `Aula ${posicao + 1}`}
            </p>
            <p className="font-titulo text-lg font-bold break-words text-texto">
              {curso}
            </p>
          </div>
          <Link
            href="/cursos"
            className="hidden min-h-12 items-center gap-3 font-titulo text-2xl text-texto md:flex"
          >
            <LogoDoAva semSubtitulo className="[--altura:60px]" />
          </Link>
          <nav aria-label="Trilha da aula" className="hidden min-w-0 md:block">
            <ol className="flex flex-wrap items-center gap-x-2 text-base">
              <li>
                <Link
                  href={linkDoCurso}
                  className="inline-flex min-h-12 items-center font-semibold break-words text-bordo underline"
                >
                  {curso}
                </Link>
              </li>
              <li aria-hidden="true" className="text-texto-secundario">
                /
              </li>
              <li className="break-words text-texto-secundario">
                {aula.modulos.titulo}
              </li>
              <li aria-hidden="true" className="text-texto-secundario">
                /
              </li>
              <li aria-current="page" className="font-bold break-words">
                {aula.titulo}
              </li>
            </ol>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 pt-4 pb-8 md:pt-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6 md:space-y-8">
          {!aluno && (
            <p className="rounded-xl bg-amarelo-claro p-3 text-base text-texto-sobre-amarelo">
              Pré-visualização do aluno. Os botões de concluir não aparecem para
              você.
            </p>
          )}

          {video && embedDoVideo && (
            <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-vinho">
              <Cordas className="absolute inset-y-0 left-1/2 w-48 -translate-x-1/2" />
              <iframe
                src={embedDoVideo.src}
                title={video.titulo || "Vídeo do YouTube"}
                loading="lazy"
                allow="encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="relative h-full w-full border-0"
              />
            </div>
          )}

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0 space-y-1">
              {posicao >= 0 && (
                <p className="hidden text-sm font-bold text-bordo md:block">
                  Aula {posicao + 1} de {sequencia.length}
                </p>
              )}
              <h1 className="font-titulo text-3xl font-bold break-words text-texto sm:text-4xl">
                {aula.titulo}
              </h1>
            </div>
            {aluno && (
              <form
                action={marcarAula.bind(null, aula.id, !concluida)}
                className="max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-10 max-md:border-t max-md:border-linha max-md:bg-superficie max-md:px-4 max-md:pt-3 max-md:pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
              >
                <BotaoEnviar
                  className={classesDoBotao(
                    concluida ? "secundario" : "primario",
                    "md:w-auto",
                  )}
                >
                  {concluida ? (
                    <>
                      <span aria-hidden="true" className="text-sucesso">
                        ✓
                      </span>{" "}
                      Aula concluída
                      <span className="sr-only"> (toque para desmarcar)</span>
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true" className="text-amarelo">
                        ✓
                      </span>{" "}
                      Marcar como concluída
                    </>
                  )}
                </BotaoEnviar>
              </form>
            )}
          </div>

          {blocos.length === 0 && (
            <p className="text-lg">Esta aula ainda não tem conteúdo.</p>
          )}

          {textos.length > 0 && (
            <div className="space-y-4 text-lg leading-relaxed text-texto-secundario">
              {textos.map((bloco) => (
                <section key={bloco.id} className="space-y-2">
                  {bloco.titulo && (
                    <h2 className="font-bold break-words text-texto">
                      {bloco.titulo}
                    </h2>
                  )}
                  <p className="break-words whitespace-pre-wrap">
                    {bloco.texto ?? ""}
                  </p>
                </section>
              ))}
            </div>
          )}

          {materiais.length > 0 && (
            <section aria-labelledby="materiais" className="space-y-4">
              <h2 id="materiais" className="text-sm font-bold text-bordo">
                Materiais da aula
              </h2>
              <ul className="grid gap-4 md:grid-cols-2">
                {materiais.map((bloco) => (
                  <MaterialDaAula
                    key={bloco.id}
                    bloco={bloco}
                    email={sessao.email}
                  >
                    {aluno && bloco.tipo === "prova" && (
                      <BotaoProva
                        aulaId={aula.id}
                        conteudoId={bloco.id}
                        enviada={marcados.has(bloco.id)}
                      />
                    )}
                  </MaterialDaAula>
                ))}
              </ul>
            </section>
          )}

          {moduloAtual && (
            <details className="group rounded-2xl border border-linha bg-superficie md:hidden">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-2 font-bold [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 break-words">
                  Aulas de {moduloAtual.titulo}
                </span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5 shrink-0 transition-transform group-open:rotate-180"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <div className="px-2 pb-2">{listaDoModulo()}</div>
            </details>
          )}

          <nav
            aria-label="Navegar entre as aulas"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {anterior && (
              <Link
                href={`/aulas/${anterior.id}`}
                className={classesDoBotao("secundario")}
              >
                ← Aula anterior
              </Link>
            )}
            {seguinte && (
              <Link
                href={`/aulas/${seguinte.id}`}
                className={classesDoBotao("secundario", "sm:col-start-2")}
              >
                Próxima aula →
              </Link>
            )}
          </nav>
        </div>

        <aside
          aria-label={`Aulas de ${curso}`}
          className="hidden h-fit space-y-5 rounded-3xl border border-linha bg-superficie p-5 md:block"
        >
          <p className="text-sm font-bold break-words text-bordo">{curso}</p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <BarraProgresso
                percentual={percentual}
                rotulo={`Progresso em ${curso}`}
                cor="bordo"
                comTexto={false}
              />
            </div>
            <span className="text-sm font-bold">{percentual}%</span>
          </div>

          {moduloAtual && (
            <nav
              aria-label={`Aulas de ${moduloAtual.titulo}`}
              className="space-y-2"
            >
              <h2 className="font-bold break-words">{moduloAtual.titulo}</h2>
              {listaDoModulo()}
            </nav>
          )}

          <Link
            href={linkDoCurso}
            className="inline-flex min-h-12 items-center font-semibold text-bordo underline"
          >
            Ver todos os módulos
          </Link>
        </aside>
      </main>
      {aluno && (
        <div
          aria-hidden="true"
          className="h-[calc(5.25rem+env(safe-area-inset-bottom))] shrink-0 md:hidden"
        />
      )}
    </>
  );
}

export default function AulaDoAluno({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div data-tela-cheia className="flex flex-1 flex-col">
      <Suspense fallback={<p className="p-4">Carregando…</p>}>
        <PaginaDaAula params={params} />
      </Suspense>
    </div>
  );
}
