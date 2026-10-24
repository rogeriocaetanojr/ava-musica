import Link from "next/link";
import { TelaDoProfessor } from "@/components/tela-do-professor";
import { BotaoVoltar } from "@/components/botao-voltar";
import { CONTEINER } from "@/components/conteiner";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { exigirProfessor } from "@/lib/auth";
import { type Direcao, ordenar } from "@/lib/ordem";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { FormularioCurso } from "../formulario-curso";
import { ehUuid } from "../validacao";
import {
  criarAula,
  criarModulo,
  editarCurso,
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

type Aula = { id: string; titulo: string; ordem: number; publicada: boolean };
type Modulo = { id: string; titulo: string; ordem: number; aulas: Aula[] };
type Curso = {
  id: string;
  titulo: string;
  instrumento: string;
  nivel: string | null;
  descricao: string | null;
  capa_url: string | null;
  publicado: boolean;
  modulos: Modulo[];
};

const botaoPequeno =
  "rounded-md border border-current px-3 py-2 text-sm disabled:opacity-30 md:inline-flex md:min-h-12 md:items-center md:rounded-xl md:border-linha md:bg-superficie md:px-4 md:font-bold md:text-texto md:hover:border-borda-campo";

// No computador, os botões de ordem viram quadrados de 48 px só com o ícone;
// desativados, mantêm o tamanho e ficam apagados.
const botaoDeIcone = `${botaoPequeno} md:size-12 md:justify-center md:px-0 md:disabled:cursor-not-allowed md:disabled:bg-fundo md:disabled:text-borda-campo/50 md:disabled:opacity-100`;

// Largura de editar, subir e descer lado a lado, para o botão Adicionar
// alinhar com essa coluna.
const LARGURA_DA_COLUNA = "md:w-40";

const tituloDeSecao =
  "text-xl font-semibold md:font-titulo md:text-2xl md:font-normal md:text-texto";

function Etiqueta({ publicado, texto }: { publicado: boolean; texto: string }) {
  return (
    <span
      className={`rounded px-2 py-1 text-xs font-medium ${
        publicado
          ? "bg-green-100 text-green-800 md:bg-linha md:text-bordo"
          : "bg-yellow-100 text-yellow-800 md:bg-amarelo-claro md:text-texto-sobre-amarelo"
      } md:rounded-full md:px-3 md:font-bold`}
    >
      {texto}
    </span>
  );
}

function Seta({ direcao }: { direcao: Direcao }) {
  return (
    <>
      <span className="md:hidden">{direcao === "subir" ? "↑" : "↓"}</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="hidden size-5 md:block"
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
  mover: (direcao: Direcao) => Promise<void>;
  primeiro: boolean;
  ultimo: boolean;
  nome: string;
}) {
  return (
    <div className="flex gap-2">
      <form action={mover.bind(null, "subir")}>
        <button
          type="submit"
          disabled={primeiro}
          aria-label={`Subir ${nome}`}
          className={botaoDeIcone}
        >
          <Seta direcao="subir" />
        </button>
      </form>
      <form action={mover.bind(null, "descer")}>
        <button
          type="submit"
          disabled={ultimo}
          aria-label={`Descer ${nome}`}
          className={botaoDeIcone}
        >
          <Seta direcao="descer" />
        </button>
      </form>
    </div>
  );
}

function ItemAula({
  aula,
  primeira,
  ultima,
}: {
  aula: Aula;
  primeira: boolean;
  ultima: boolean;
}) {
  return (
    <li className="space-y-2 rounded-md border border-current/30 p-3 md:flex md:items-center md:gap-2 md:space-y-0 md:rounded-none md:border-0 md:border-t md:border-linha md:px-0 md:py-3 md:first:border-t-0">
      <EdicaoDoTitulo>
        <TituloEditavel
          titulo={aula.titulo}
          classeDoTitulo="font-bold text-texto"
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
        <div className="flex flex-wrap items-center justify-between gap-2 md:contents">
          <div className="flex items-center gap-2 md:contents">
            <span className="md:hidden">
              <Etiqueta
                publicado={aula.publicada}
                texto={aula.publicada ? "Publicada" : "Rascunho"}
              />
            </span>
            <form action={publicarAula.bind(null, aula.id, !aula.publicada)}>
              <button
                type="submit"
                className={`${botaoPequeno} md:w-32 md:justify-center`}
              >
                {aula.publicada ? "Despublicar" : "Publicar"}
              </button>
            </form>
            <Link href={`/professor/aulas/${aula.id}`} className={botaoPequeno}>
              Conteúdo
            </Link>
            <BotaoEditar nome={`a aula ${aula.titulo}`} />
          </div>
          <BotoesDeOrdem
            mover={moverAula.bind(null, aula.id)}
            primeiro={primeira}
            ultimo={ultima}
            nome={`a aula ${aula.titulo}`}
          />
        </div>
      </EdicaoDoTitulo>
    </li>
  );
}

function ItemModulo({
  modulo,
  posicao,
  primeiro,
  ultimo,
}: {
  modulo: Modulo;
  posicao: number;
  primeiro: boolean;
  ultimo: boolean;
}) {
  const aulas = ordenar(modulo.aulas);

  return (
    <li className="space-y-4 rounded-md border border-current p-3 sm:p-4 md:rounded-3xl md:border-linha md:bg-superficie md:p-6 lg:rounded-none lg:border-x-0 lg:border-t-0 lg:bg-transparent lg:p-0 lg:py-6 lg:first:pt-0 lg:last:border-b-0 lg:last:pb-0">
      <EdicaoDoTitulo>
        <div className="space-y-2 md:flex md:items-center md:gap-2 md:space-y-0">
          <div className="flex items-center justify-between gap-2 md:contents">
            <h3 className="font-semibold md:order-first md:mr-2 md:shrink-0 md:text-sm md:font-bold md:text-bordo">
              Módulo {posicao}
            </h3>
            <div className="md:order-last md:flex md:gap-2">
              <BotaoEditar nome={`o módulo ${modulo.titulo}`} />
              <BotoesDeOrdem
                mover={moverModulo.bind(null, modulo.id)}
                primeiro={primeiro}
                ultimo={ultimo}
                nome={`o módulo ${modulo.titulo}`}
              />
            </div>
          </div>
          <TituloEditavel
            titulo={modulo.titulo}
            classeDoTitulo="font-titulo text-xl text-texto"
          >
            <FormularioTitulo
              acao={renomearModulo.bind(null, modulo.id)}
              rotulo="Título do módulo"
              textoDoBotao="Salvar"
              inicial={modulo.titulo}
            />
          </TituloEditavel>
        </div>
      </EdicaoDoTitulo>

      {aulas.length === 0 ? (
        <p className="text-sm md:text-texto-secundario">
          Nenhuma aula neste módulo.
        </p>
      ) : (
        <ol className="space-y-3 md:space-y-0">
          {aulas.map((aula, indice) => (
            <ItemAula
              key={aula.id}
              aula={aula}
              primeira={indice === 0}
              ultima={indice === aulas.length - 1}
            />
          ))}
        </ol>
      )}

      <div className="md:border-t md:border-linha md:pt-4">
        <FormularioTitulo
          acao={criarAula.bind(null, modulo.id)}
          rotulo="Nova aula"
          textoDoBotao="Adicionar"
          classeDoBotao={LARGURA_DA_COLUNA}
        />
      </div>
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
      "id, titulo, instrumento, nivel, descricao, capa_url, publicado, modulos (id, titulo, ordem, aulas (id, titulo, ordem, publicada))",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const curso = data as Curso;
  const modulos = ordenar(curso.modulos);

  return (
    <>
      <div className="md:flex md:items-center md:gap-4">
        <div className="hidden md:block">
          <BotaoVoltar href="/professor/cursos" rotulo="Voltar para Cursos" />
        </div>
        <div className="min-w-0 md:flex md:flex-wrap md:items-center md:gap-3">
          <h1 className="text-2xl font-bold break-words md:font-titulo md:text-5xl md:font-normal md:text-texto">
            {curso.titulo}
          </h1>
          <span className="hidden md:inline">
            <Etiqueta
              publicado={curso.publicado}
              texto={curso.publicado ? "Publicado" : "Rascunho"}
            />
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-6">
        <section className="space-y-4 md:max-w-3xl md:rounded-3xl md:border md:border-linha md:bg-superficie md:p-6 lg:sticky lg:top-6 lg:col-span-5 lg:max-w-none">
          <h2 className={tituloDeSecao}>Dados do curso</h2>
          <FormularioCurso
            acao={editarCurso.bind(null, curso.id)}
            textoDoBotao="Salvar curso"
            inicial={{
              titulo: curso.titulo,
              instrumento: curso.instrumento,
              nivel: curso.nivel ?? "",
              descricao: curso.descricao ?? "",
              capa_url: curso.capa_url ?? "",
              publicado: curso.publicado ? "on" : "",
            }}
          />
        </section>

        <section className="space-y-4 md:space-y-6 lg:col-span-7 lg:rounded-3xl lg:border lg:border-linha lg:bg-superficie lg:p-6">
          <h2 className={tituloDeSecao}>Módulos e aulas</h2>
          {modulos.length === 0 ? (
            <p>Nenhum módulo criado ainda.</p>
          ) : (
            <ol className="space-y-4 md:space-y-6 lg:space-y-0">
              {modulos.map((modulo, indice) => (
                <ItemModulo
                  key={modulo.id}
                  modulo={modulo}
                  posicao={indice + 1}
                  primeiro={indice === 0}
                  ultimo={indice === modulos.length - 1}
                />
              ))}
            </ol>
          )}
          <div className="md:max-w-3xl md:rounded-3xl md:border md:border-dashed md:border-borda-campo md:p-6 lg:max-w-none lg:rounded-none lg:border-x-0 lg:border-b-0 lg:border-solid lg:border-linha lg:px-0 lg:pb-0">
            <FormularioTitulo
              acao={criarModulo.bind(null, curso.id)}
              rotulo="Novo módulo"
              textoDoBotao="Adicionar"
              classeDoBotao={LARGURA_DA_COLUNA}
            />
          </div>
        </section>
      </div>
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
        className={`${CONTEINER} flex max-w-2xl flex-1 flex-col gap-8 py-8 md:py-10`}
      >
        <Link href="/professor/cursos" className="text-sm underline md:hidden">
          ← Cursos
        </Link>
        <Suspense fallback={<p>Carregando…</p>}>
          <EditorDoCurso params={params} />
        </Suspense>
      </main>
    </TelaDoProfessor>
  );
}
