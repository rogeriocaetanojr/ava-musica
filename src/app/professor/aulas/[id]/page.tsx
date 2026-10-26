import Link from "next/link";
import { TelaDoProfessor } from "@/components/tela-do-professor";
import { BotaoVoltar } from "@/components/botao-voltar";
import { classesDoBotao } from "@/components/botao";
import { CONTEINER } from "@/components/conteiner";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Bloco } from "@/components/bloco-conteudo";
import { exigirProfessor } from "@/lib/auth";
import type { TipoDeBloco } from "@/lib/embeds";
import { type Direcao, ordenar } from "@/lib/ordem";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { publicarAula, renomearAula } from "../../cursos/[id]/acoes";
import {
  AoEditar,
  BotaoEditar,
  EdicaoDoTitulo,
} from "../../cursos/[id]/edicao-do-titulo";
import { ehUuid } from "../../cursos/validacao";
import { criarBloco, editarBloco, moverBloco, removerBloco } from "./acoes";
import { BotaoRemover } from "./botao-remover";
import { FormularioBloco } from "./formulario-bloco";
import { FormularioDados } from "./formulario-dados";
import { NOMES_DOS_TIPOS } from "./validacao";

type Conteudo = Bloco & { id: string; ordem: number };
type Aula = {
  id: string;
  titulo: string;
  publicada: boolean;
  modulos: { titulo: string; curso_id: string; cursos: { titulo: string } };
  conteudos: Conteudo[];
};

// Botões de ação: quadrados de 48 px só com o ícone; desativados, mantêm o
// tamanho e ficam apagados.
const botaoDeIcone =
  "grid size-12 shrink-0 place-items-center rounded-xl border border-linha bg-superficie text-texto hover:border-borda-campo disabled:cursor-not-allowed disabled:bg-fundo disabled:text-borda-campo/50";

const tituloDeSecao = "font-titulo text-2xl text-texto";
const cartao = "rounded-3xl border border-linha bg-superficie p-4 md:p-6";

// Ícone de cada tipo, no traço dos materiais da aula do aluno.
const ICONES: Record<TipoDeBloco, string> = {
  texto: "M5 6h14M5 10h14M5 14h10M5 18h7",
  youtube: "M3 6h18v12H3zM10 9l5 3-5 3z",
  drive: "M14 3H6v18h12V7zM14 3v4h4",
  audio:
    "M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  link: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  prova: "M4 4h16v16H4zM8 12l3 3 5-6",
};

function Icone({ d, classe = "size-5" }: { d: string; classe?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={classe}
    >
      <path d={d} />
    </svg>
  );
}

function IconeDoTipo({ tipo }: { tipo: TipoDeBloco }) {
  return (
    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-amarelo-claro text-bordo">
      <Icone d={ICONES[tipo]} classe="size-6" />
    </span>
  );
}

function Etiqueta({ publicada }: { publicada: boolean }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
        publicada
          ? "bg-linha text-bordo"
          : "bg-amarelo-claro text-texto-sobre-amarelo"
      }`}
    >
      {publicada ? "Publicada" : "Rascunho"}
    </span>
  );
}

function nomeDoBloco(bloco: Bloco): string {
  return bloco.titulo || NOMES_DOS_TIPOS[bloco.tipo];
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
    <>
      <form action={mover.bind(null, "subir")}>
        <button
          type="submit"
          disabled={primeiro}
          aria-label={`Subir ${nome}`}
          className={botaoDeIcone}
        >
          <Icone d="M12 19V5M6 11l6-6 6 6" />
        </button>
      </form>
      <form action={mover.bind(null, "descer")}>
        <button
          type="submit"
          disabled={ultimo}
          aria-label={`Descer ${nome}`}
          className={botaoDeIcone}
        >
          <Icone d="M12 5v14M6 13l6 6 6-6" />
        </button>
      </form>
    </>
  );
}

// Prévia curta: o começo do texto ou o link do material.
function Previa({ bloco }: { bloco: Bloco }) {
  if (bloco.tipo === "texto")
    return (
      <p className="line-clamp-3 whitespace-pre-line text-texto-secundario">
        {bloco.texto}
      </p>
    );
  return (
    <p
      className="truncate text-sm text-texto-secundario"
      title={bloco.url ?? ""}
    >
      {bloco.url}
    </p>
  );
}

function ItemBloco({
  bloco,
  posicao,
  primeiro,
  ultimo,
  email,
}: {
  bloco: Conteudo;
  posicao: number;
  primeiro: boolean;
  ultimo: boolean;
  email: string;
}) {
  const nome = `o bloco ${posicao}, ${nomeDoBloco(bloco)}`;

  return (
    <li className={`space-y-4 ${cartao}`}>
      <EdicaoDoTitulo>
        <div className="flex flex-wrap items-start gap-4">
          <IconeDoTipo tipo={bloco.tipo} />
          <div className="min-w-0 flex-1 basis-48">
            <p className="text-sm font-bold text-bordo">
              {posicao}. {NOMES_DOS_TIPOS[bloco.tipo]}
            </p>
            <p className="font-bold break-words text-texto">
              {nomeDoBloco(bloco)}
            </p>
          </div>
          <div className="flex gap-2">
            <BotaoEditar nome={nome} />
            <BotoesDeOrdem
              mover={moverBloco.bind(null, bloco.id)}
              primeiro={primeiro}
              ultimo={ultimo}
              nome={nome}
            />
            <BotaoRemover
              remover={removerBloco.bind(null, bloco.id)}
              nome={nome}
              className={botaoDeIcone}
            />
          </div>
        </div>

        <AoEditar fora={<Previa bloco={bloco} />}>
          <div className="border-t border-linha pt-4">
            <FormularioBloco
              acao={editarBloco.bind(null, bloco.id)}
              textoDoBotao="Salvar bloco"
              inicial={bloco}
              email={email}
            />
          </div>
        </AoEditar>
      </EdicaoDoTitulo>
    </li>
  );
}

async function EditorDaAula({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirProfessor();
  const { id } = await params;
  if (!ehUuid(id)) notFound();

  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("aulas")
    .select(
      "id, titulo, publicada, modulos (titulo, curso_id, cursos (titulo)), conteudos (id, tipo, ordem, titulo, texto, url)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const aula = data as unknown as Aula;
  const blocos = ordenar(aula.conteudos);
  const linkDoCurso = `/professor/cursos/${aula.modulos.curso_id}`;

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <BotaoVoltar href={linkDoCurso} rotulo="Voltar ao curso" />
        <nav aria-label="Trilha da aula" className="min-w-0 flex-1">
          <ol className="flex flex-wrap items-center gap-x-2 text-base">
            <li>
              <Link
                href={linkDoCurso}
                className="inline-flex min-h-12 items-center font-semibold break-words text-bordo underline"
              >
                {aula.modulos.cursos.titulo}
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

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h1 className="font-titulo text-3xl break-words text-texto md:text-5xl">
            {aula.titulo}
          </h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-texto-secundario">
            <Etiqueta publicada={aula.publicada} /> · {blocos.length}{" "}
            {blocos.length === 1 ? "bloco" : "blocos"}
          </p>
        </div>
        <form action={publicarAula.bind(null, aula.id, !aula.publicada)}>
          <button
            type="submit"
            className={classesDoBotao(
              aula.publicada ? "secundario" : "primario",
              "md:w-auto",
            )}
          >
            {aula.publicada ? "Despublicar" : "Publicar"}
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-6 md:gap-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-6">
        <div className="flex flex-col gap-6 md:gap-8 lg:col-span-8">
          <section
            className={`space-y-4 border-dashed border-borda-campo ${cartao}`}
          >
            <h2 className={tituloDeSecao}>Novo bloco</h2>
            <FormularioBloco
              acao={criarBloco.bind(null, aula.id)}
              textoDoBotao="Adicionar bloco"
              email={sessao.email}
              limparAoSalvar
            />
          </section>

          <section className={`space-y-4 ${cartao}`}>
            <h2 className={tituloDeSecao}>Dados da aula</h2>
            <FormularioDados
              acao={renomearAula.bind(null, aula.id)}
              titulo={aula.titulo}
            />
          </section>

          <section className="space-y-4">
            <h2 className={tituloDeSecao}>Conteúdo da aula</h2>
            {blocos.length === 0 ? (
              <p className="text-texto-secundario">
                Nenhum bloco ainda. Adicione o primeiro acima.
              </p>
            ) : (
              <ol className="space-y-4">
                {blocos.map((bloco, indice) => (
                  <ItemBloco
                    key={bloco.id}
                    bloco={bloco}
                    posicao={indice + 1}
                    primeiro={indice === 0}
                    ultimo={indice === blocos.length - 1}
                    email={sessao.email}
                  />
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside
          aria-labelledby="como-o-aluno-ve"
          className={`space-y-4 lg:sticky lg:top-6 lg:col-span-4 ${cartao}`}
        >
          <h2 id="como-o-aluno-ve" className={tituloDeSecao}>
            Como o aluno vê
          </h2>
          {blocos.length === 0 ? (
            <p className="text-sm text-texto-secundario">
              A aula ainda não tem conteúdo.
            </p>
          ) : (
            <ol className="space-y-3">
              {blocos.map((bloco) => (
                <li key={bloco.id} className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amarelo-claro text-bordo">
                    <Icone d={ICONES[bloco.tipo]} />
                  </span>
                  <span className="min-w-0 break-words text-texto">
                    {nomeDoBloco(bloco)}
                  </span>
                </li>
              ))}
            </ol>
          )}
          <p className="text-sm text-texto-secundario">
            O aluno só vê a aula depois de publicada, e com o curso publicado.
          </p>
          <Link
            href={`/aulas/${aula.id}`}
            className={classesDoBotao("secundario")}
          >
            Abrir como aluno
          </Link>
        </aside>
      </div>
    </>
  );
}

export default function EditarAula({
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
          <EditorDaAula params={params} />
        </Suspense>
      </main>
    </TelaDoProfessor>
  );
}
