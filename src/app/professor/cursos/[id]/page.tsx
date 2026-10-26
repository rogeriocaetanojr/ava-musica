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
import { Recolhivel } from "./recolhivel";

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
  "inline-flex min-h-12 items-center rounded-xl border border-linha bg-superficie px-4 text-sm font-bold text-texto hover:border-borda-campo";

// Botões de ordem: quadrados de 48 px só com o ícone; desativados, mantêm o
// tamanho e ficam apagados.
const botaoDeIcone = `${botaoPequeno} size-12 justify-center px-0 disabled:cursor-not-allowed disabled:bg-fundo disabled:text-borda-campo/50`;

// Largura de editar, subir e descer lado a lado, para o botão Adicionar
// alinhar com essa coluna.
const LARGURA_DA_COLUNA = "md:w-40";

const tituloDeSecao = "font-titulo text-2xl text-texto";

function Etiqueta({ publicado, texto }: { publicado: boolean; texto: string }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
        publicado
          ? "bg-linha text-bordo"
          : "bg-amarelo-claro text-texto-sobre-amarelo"
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
    <li className="space-y-3 border-t border-linha py-3 first:border-t-0 md:flex md:items-center md:gap-2 md:space-y-0">
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
        <div className="flex flex-wrap items-center gap-2 md:contents">
          <div className="contents">
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
    <li className="space-y-2 rounded-2xl border border-linha bg-superficie px-4 py-2 md:space-y-4 md:rounded-3xl md:p-6 lg:rounded-none lg:border-x-0 lg:border-t-0 lg:bg-transparent lg:p-0 lg:py-6 lg:first:pt-0 lg:last:border-b-0 lg:last:pb-0">
      <Recolhivel
        abertoNoInicio={posicao === 1}
        classeDoConteudo="space-y-4 pb-2 md:pb-0"
        cabecalho={
          <>
            <span className="block text-sm font-bold text-bordo">
              Módulo {posicao} · {aulas.length}{" "}
              {aulas.length === 1 ? "aula" : "aulas"}
            </span>
            <span className="block font-titulo text-xl break-words text-texto">
              {modulo.titulo}
            </span>
          </>
        }
      >
        <EdicaoDoTitulo>
          <div className="space-y-2 md:flex md:items-center md:gap-2 md:space-y-0">
            <div className="flex items-center justify-end gap-2 md:contents">
              <h3 className="order-first mr-2 shrink-0 text-sm font-bold text-bordo max-md:hidden">
                Módulo {posicao}
              </h3>
              <div className="flex gap-2 md:order-last">
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
              classeDoTitulo="font-titulo text-xl text-texto max-md:hidden"
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
          <p className="text-sm text-texto-secundario">
            Nenhuma aula neste módulo.
          </p>
        ) : (
          <ol>
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

        <div className="border-t border-linha pt-4">
          <FormularioTitulo
            acao={criarAula.bind(null, modulo.id)}
            rotulo="Nova aula"
            textoDoBotao="Adicionar"
            classeDoBotao={LARGURA_DA_COLUNA}
          />
        </div>
      </Recolhivel>
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
      <div className="flex items-center gap-4">
        <div>
          <BotaoVoltar href="/professor/cursos" rotulo="Voltar para Cursos" />
        </div>
        <div className="min-w-0 md:flex md:flex-wrap md:items-center md:gap-3">
          <h1 className="font-titulo text-3xl break-words text-texto md:text-5xl">
            {curso.titulo}
          </h1>
          <span className="mt-1 inline-block md:mt-0 md:inline">
            <Etiqueta
              publicado={curso.publicado}
              texto={curso.publicado ? "Publicado" : "Rascunho"}
            />
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6 md:gap-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-6">
        <section className="space-y-4 rounded-3xl border border-linha bg-superficie px-4 py-2 md:max-w-3xl md:p-6 lg:sticky lg:top-6 lg:col-span-5 lg:max-w-none">
          <h2 className={`${tituloDeSecao} max-md:sr-only`}>Dados do curso</h2>
          <Recolhivel
            abertoNoInicio
            classeDoConteudo="pb-3 md:pb-0"
            cabecalho={<span className={tituloDeSecao}>Dados do curso</span>}
          >
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
          </Recolhivel>
        </section>

        <section className="space-y-4 md:space-y-6 lg:col-span-7 lg:rounded-3xl lg:border lg:border-linha lg:bg-superficie lg:p-6">
          <h2 className={tituloDeSecao}>Módulos e aulas</h2>
          {modulos.length === 0 ? (
            <p>Nenhum módulo criado ainda.</p>
          ) : (
            <ol className="space-y-3 md:space-y-6 lg:space-y-0">
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
          <div className="rounded-2xl border border-dashed border-borda-campo p-4 md:max-w-3xl md:rounded-3xl md:p-6 lg:max-w-none lg:rounded-none lg:border-x-0 lg:border-b-0 lg:border-solid lg:border-linha lg:px-0 lg:pb-0">
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
        className={`${CONTEINER} flex max-w-2xl flex-1 flex-col gap-6 py-6 md:gap-8 md:py-10`}
      >
        <Suspense fallback={<p>Carregando…</p>}>
          <EditorDoCurso params={params} />
        </Suspense>
      </main>
    </TelaDoProfessor>
  );
}
