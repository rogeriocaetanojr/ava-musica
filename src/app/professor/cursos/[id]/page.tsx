import Link from "next/link";
import { FormularioDeAcao } from "@/components/formulario-de-acao";
import type { ResultadoDaAcao } from "@/lib/acoes";
import { TelaDoProfessor } from "@/components/tela-do-professor";
import { LinhaDeVoltar } from "@/components/linha-de-voltar";
import { CONTEINER } from "@/components/conteiner";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { exigirProfessor } from "@/lib/auth";
import { type Direcao, ordenar } from "@/lib/ordem";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { BotaoRemover } from "../../aulas/[id]/botao-remover";
import { type ResumoDaExclusao, textoDaExclusao } from "../exclusao";
import { PainelDoCurso } from "../painel-do-curso";
import { ehUuid } from "../validacao";
import {
  criarAula,
  criarModulo,
  editarCurso,
  excluirAula,
  excluirCurso,
  excluirModulo,
  publicarCurso,
  moverAula,
  moverModulo,
  publicarAula,
  renomearAula,
  renomearModulo,
} from "./acoes";
import {
  BotaoEditar,
  EdicaoDoTitulo,
  TituloEditavel,
} from "./edicao-do-titulo";
import { FormularioTitulo } from "./formulario-titulo";
import { PainelDeTitulo } from "./painel-de-titulo";
import { classesDoBotao } from "@/components/botao";

type Aula = { id: string; titulo: string; ordem: number; publicada: boolean };
type Modulo = { id: string; titulo: string; ordem: number; aulas: Aula[] };
type Curso = {
  id: string;
  titulo: string;
  instrumento: string;
  nivel: string | null;
  descricao: string | null;
  publicado: boolean;
  modulos: Modulo[];
};

const botaoPequeno =
  "inline-flex min-h-12 items-center rounded-xl border border-linha bg-superficie px-4 text-sm font-bold text-texto hover:border-borda-campo";

// Botões de ordem: quadrados de 48 px só com o ícone; desativados, mantêm o
// tamanho e ficam apagados.
const botaoDeIcone = `${botaoPequeno} size-12 justify-center px-0 disabled:cursor-not-allowed disabled:bg-fundo disabled:text-borda-campo/50`;

const tituloDeSecao = "font-titulo text-2xl text-texto";

function Etiqueta({ publicado, texto }: { publicado: boolean; texto: string }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
        publicado ? "bg-linha text-destaque" : "bg-bloco text-texto-sobre-bloco"
      }`}
    >
      {texto}
    </span>
  );
}

function Seta({ direcao }: { direcao: Direcao }) {
  return (
    <>
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
        <path
          d={
            direcao === "subir"
              ? "M12 19V5M6 11l6-6 6 6"
              : "M12 5v14M6 13l6 6 6-6"
          }
        />
      </svg>
    </>
  );
}

function BotoesDeOrdem({
  mover,
  primeiro,
  ultimo,
  nome,
}: {
  mover: (direcao: Direcao) => Promise<ResultadoDaAcao>;
  primeiro: boolean;
  ultimo: boolean;
  nome: string;
}) {
  return (
    <div className="flex gap-2">
      <FormularioDeAcao acao={mover.bind(null, "subir")}>
        <button
          type="submit"
          disabled={primeiro}
          aria-label={`Subir ${nome}`}
          className={botaoDeIcone}
        >
          <Seta direcao="subir" />
        </button>
      </FormularioDeAcao>
      <FormularioDeAcao acao={mover.bind(null, "descer")}>
        <button
          type="submit"
          disabled={ultimo}
          aria-label={`Descer ${nome}`}
          className={botaoDeIcone}
        >
          <Seta direcao="descer" />
        </button>
      </FormularioDeAcao>
    </div>
  );
}

type Resumos = Map<string, ResumoDaExclusao>;

function ItemAula({
  aula,
  primeira,
  ultima,
  resumos,
}: {
  aula: Aula;
  primeira: boolean;
  ultima: boolean;
  resumos: Resumos;
}) {
  return (
    <li className="border-t border-linha py-2 first:border-t-0">
      <EdicaoDoTitulo>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <TituloEditavel
            titulo={aula.titulo}
            classeDoTitulo="font-bold text-texto"
            quebraLinha
            extra={
              <Etiqueta
                publicado={aula.publicada}
                texto={aula.publicada ? "Publicada" : "Rascunho"}
              />
            }
          >
            <FormularioTitulo
              acao={renomearAula.bind(null, aula.id)}
              rotulo="Título da aula"
              textoDoBotao="Salvar"
              inicial={aula.titulo}
            />
          </TituloEditavel>
          <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">
            <FormularioDeAcao
              acao={publicarAula.bind(null, aula.id, !aula.publicada)}
            >
              <button type="submit" className={botaoPequeno}>
                {aula.publicada ? "Despublicar" : "Publicar"}
              </button>
            </FormularioDeAcao>
            <Link href={`/professor/aulas/${aula.id}`} className={botaoPequeno}>
              Conteúdo
            </Link>
            <BotaoEditar nome={`a aula ${aula.titulo}`} />
            <BotoesDeOrdem
              mover={moverAula.bind(null, aula.id)}
              primeiro={primeira}
              ultimo={ultima}
              nome={`a aula ${aula.titulo}`}
            />
            <BotaoRemover
              remover={excluirAula.bind(null, aula.id)}
              nome={`a aula ${aula.titulo}`}
              className={botaoDeIcone}
              confirmar={textoDaExclusao(
                "aula",
                aula.titulo,
                resumos.get(aula.id),
              )}
            />
          </div>
        </div>
      </EdicaoDoTitulo>
    </li>
  );
}

// Bloco compacto do módulo: o título com as setas de ordem, editar e excluir
// à direita; embaixo, as aulas em linhas e o botão Nova aula.
function ItemModulo({
  modulo,
  posicao,
  primeiro,
  ultimo,
  resumos,
}: {
  modulo: Modulo;
  posicao: number;
  primeiro: boolean;
  ultimo: boolean;
  resumos: Resumos;
}) {
  const aulas = ordenar(modulo.aulas);

  return (
    <li className="space-y-3 rounded-2xl border border-linha bg-fundo p-4">
      <EdicaoDoTitulo>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-0.5">
            <h3 className="text-sm font-bold text-destaque">
              Módulo {posicao} · {aulas.length}{" "}
              {aulas.length === 1 ? "aula" : "aulas"}
            </h3>
            <TituloEditavel
              titulo={modulo.titulo}
              classeDoTitulo="font-titulo text-xl text-texto"
              quebraLinha
            >
              <FormularioTitulo
                acao={renomearModulo.bind(null, modulo.id)}
                rotulo="Título do módulo"
                textoDoBotao="Salvar"
                inicial={modulo.titulo}
              />
            </TituloEditavel>
          </div>
          <div className="flex shrink-0 gap-2">
            <BotoesDeOrdem
              mover={moverModulo.bind(null, modulo.id)}
              primeiro={primeiro}
              ultimo={ultimo}
              nome={`o módulo ${modulo.titulo}`}
            />
            <BotaoEditar nome={`o módulo ${modulo.titulo}`} />
            <BotaoRemover
              remover={excluirModulo.bind(null, modulo.id)}
              nome={`o módulo ${modulo.titulo}`}
              className={botaoDeIcone}
              confirmar={textoDaExclusao(
                "modulo",
                modulo.titulo,
                resumos.get(modulo.id),
              )}
            />
          </div>
        </div>
      </EdicaoDoTitulo>

      {aulas.length === 0 ? (
        <p className="text-sm text-texto-secundario">
          Nenhuma aula neste módulo.
        </p>
      ) : (
        <ol className="rounded-xl border border-linha bg-superficie px-3">
          {aulas.map((aula, indice) => (
            <ItemAula
              key={aula.id}
              aula={aula}
              primeira={indice === 0}
              ultima={indice === aulas.length - 1}
              resumos={resumos}
            />
          ))}
        </ol>
      )}

      <PainelDeTitulo
        rotulo="Nova aula"
        titulo="Nova aula"
        rotuloDoCampo="Título da nova aula"
        rotuloAcessivel={`Nova aula no módulo ${modulo.titulo}`}
        acao={criarAula.bind(null, modulo.id)}
        variante="secundario"
        tamanho="pequeno"
        classeDoBotao=""
      />
    </li>
  );
}

async function EditorDoCurso({ params }: { params: Promise<{ id: string }> }) {
  await exigirProfessor();
  const { id } = await params;
  if (!ehUuid(id)) notFound();

  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("cursos")
    .select(
      "id, titulo, instrumento, nivel, descricao, publicado, modulos (id, titulo, ordem, aulas (id, titulo, ordem, publicada))",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const curso = data as Curso;
  const modulos = ordenar(curso.modulos);

  // O que vai junto em cada exclusão, para a confirmação. Sem o resumo, a
  // confirmação avisa que vai tudo junto, sem os números.
  const { data: listaDeResumos } = await supabase.rpc("resumo_da_exclusao", {
    curso: curso.id,
  });
  const resumos: Resumos = new Map(
    ((listaDeResumos ?? []) as ResumoDaExclusao[]).map((r) => [r.id, r]),
  );

  return (
    <>
      {/* Cabeçalho: título, selo e as ações do curso. Os dados abrem no
          mesmo painel lateral do Novo curso, já preenchido. */}
      <LinhaDeVoltar href="/professor/cursos" rotulo="Voltar para Cursos">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-titulo text-3xl break-words text-texto md:text-5xl">
              {curso.titulo}
            </h1>
            <Etiqueta
              publicado={curso.publicado}
              texto={curso.publicado ? "Publicado" : "Rascunho"}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:shrink-0">
            <FormularioDeAcao
              acao={publicarCurso.bind(null, curso.id, !curso.publicado)}
            >
              <button
                type="submit"
                className={classesDoBotao(
                  curso.publicado ? "secundario" : "destaque",
                  "sm:w-auto",
                )}
              >
                {curso.publicado ? "Despublicar" : "Publicar"}
              </button>
            </FormularioDeAcao>
            <PainelDoCurso
              rotulo="Editar curso"
              variante="secundario"
              acao={editarCurso.bind(null, curso.id)}
              textoDoBotao="Salvar curso"
              inicial={{
                titulo: curso.titulo,
                instrumento: curso.instrumento,
                nivel: curso.nivel ?? "",
                descricao: curso.descricao ?? "",
                publicado: curso.publicado ? "on" : "",
              }}
              extra={
                <FormularioDeAcao
                  acao={excluirCurso.bind(null, curso.id)}
                  confirmar={textoDaExclusao(
                    "curso",
                    curso.titulo,
                    resumos.get(curso.id),
                  )}
                >
                  <button type="submit" className={botaoPequeno}>
                    Excluir curso
                  </button>
                </FormularioDeAcao>
              }
            />
          </div>
        </div>
      </LinhaDeVoltar>

      <section
        aria-labelledby="modulos-e-aulas"
        className="space-y-4 rounded-3xl border border-linha bg-superficie p-4 md:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="modulos-e-aulas" className={tituloDeSecao}>
            Módulos e aulas
          </h2>
          {modulos.length > 0 && (
            <PainelDeTitulo
              rotulo="Novo módulo"
              titulo="Novo módulo"
              rotuloDoCampo="Título do novo módulo"
              acao={criarModulo.bind(null, curso.id)}
              tamanho="pequeno"
              classeDoBotao=""
            />
          )}
        </div>
        {modulos.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-borda-campo px-4 py-10 text-center">
            <p className="text-lg font-bold text-texto">Nenhum módulo ainda</p>
            <PainelDeTitulo
              rotulo="Criar primeiro módulo"
              titulo="Novo módulo"
              rotuloDoCampo="Título do novo módulo"
              acao={criarModulo.bind(null, curso.id)}
            />
          </div>
        ) : (
          <ol className="space-y-3">
            {modulos.map((modulo, indice) => (
              <ItemModulo
                key={modulo.id}
                modulo={modulo}
                posicao={indice + 1}
                primeiro={indice === 0}
                ultimo={indice === modulos.length - 1}
                resumos={resumos}
              />
            ))}
          </ol>
        )}
      </section>
    </>
  );
}

export default function EditarCurso({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <TelaDoProfessor atual="cursos">
      <main
        className={`${CONTEINER} flex max-w-6xl flex-1 flex-col gap-6 py-6 md:gap-8 md:py-10`}
      >
        <Suspense fallback={<p>Carregando…</p>}>
          <EditorDoCurso params={params} />
        </Suspense>
      </main>
    </TelaDoProfessor>
  );
}
