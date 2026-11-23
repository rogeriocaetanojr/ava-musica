import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Bloco } from "@/components/bloco-conteudo";
import { classesDoBotao } from "@/components/botao";
import { CONTEINER } from "@/components/conteiner";
import { FormularioDeAcao } from "@/components/formulario-de-acao";
import { LinhaDeVoltar } from "@/components/linha-de-voltar";
import { TelaDoProfessor } from "@/components/tela-do-professor";
import type { ResultadoDaAcao } from "@/lib/acoes";
import { exigirProfessor } from "@/lib/auth";
import { codigoDoAluno } from "@/lib/embeds";
import { type Direcao, ordenar } from "@/lib/ordem";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { publicarAula, renomearAula } from "../../cursos/[id]/acoes";
import { PainelDeTitulo } from "../../cursos/[id]/painel-de-titulo";
import { ehUuid } from "../../cursos/validacao";
import { criarBloco, editarBloco, moverBloco, removerBloco } from "./acoes";
import { BotaoRemover } from "./botao-remover";
import { Icone, IconeDoTipo } from "./icones";
import { PainelDoBloco } from "./painel-do-bloco";
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

const LAPIS = "M4 20h4L19 9l-4-4L4 16v4z M13.5 6.5l4 4";

function Etiqueta({ publicada }: { publicada: boolean }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
        publicada ? "bg-linha text-destaque" : "bg-bloco text-texto-sobre-bloco"
      }`}
    >
      {publicada ? "Publicada" : "Rascunho"}
    </span>
  );
}

function nomeDoBloco(bloco: Bloco): string {
  return bloco.titulo || NOMES_DOS_TIPOS[bloco.tipo];
}

// Resumo de uma linha: o começo do texto ou o link do material.
function resumoDoBloco(bloco: Bloco): string {
  if (bloco.tipo === "texto")
    return (bloco.texto ?? "").replace(/\s+/g, " ").trim();
  return bloco.url ?? "";
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
    <>
      <FormularioDeAcao acao={mover.bind(null, "subir")}>
        <button
          type="submit"
          disabled={primeiro}
          aria-label={`Subir ${nome}`}
          className={botaoDeIcone}
        >
          <Icone d="M12 19V5M6 11l6-6 6 6" />
        </button>
      </FormularioDeAcao>
      <FormularioDeAcao acao={mover.bind(null, "descer")}>
        <button
          type="submit"
          disabled={ultimo}
          aria-label={`Descer ${nome}`}
          className={botaoDeIcone}
        >
          <Icone d="M12 5v14M6 13l6 6 6-6" />
        </button>
      </FormularioDeAcao>
    </>
  );
}

// Card compacto do bloco: ícone do tipo, título e resumo de uma linha; à
// direita, as setas de ordem, editar (painel lateral) e excluir.
function ItemBloco({
  bloco,
  posicao,
  primeiro,
  ultimo,
  codigo,
}: {
  bloco: Conteudo;
  posicao: number;
  primeiro: boolean;
  ultimo: boolean;
  codigo: string;
}) {
  const nome = `o bloco ${posicao}, ${nomeDoBloco(bloco)}`;
  const resumo = resumoDoBloco(bloco);

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-linha bg-superficie p-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <IconeDoTipo tipo={bloco.tipo} />
        <div className="min-w-0 flex-1">
          <p
            className="truncate font-bold text-texto"
            title={nomeDoBloco(bloco)}
          >
            <span className="text-destaque">{posicao}.</span>{" "}
            {nomeDoBloco(bloco)}
          </p>
          <p className="truncate text-sm text-texto-secundario" title={resumo}>
            <span className="sr-only">{NOMES_DOS_TIPOS[bloco.tipo]}: </span>
            {resumo}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2 self-end sm:self-auto">
        <BotoesDeOrdem
          mover={moverBloco.bind(null, bloco.id)}
          primeiro={primeiro}
          ultimo={ultimo}
          nome={nome}
        />
        <PainelDoBloco
          rotulo="Editar bloco"
          rotuloAcessivel={`Editar ${nome}`}
          acao={editarBloco.bind(null, bloco.id)}
          codigo={codigo}
          inicial={bloco}
          botaoProprio={{
            className: botaoDeIcone,
            conteudo: <Icone d={LAPIS} />,
          }}
        />
        <BotaoRemover
          remover={removerBloco.bind(null, bloco.id)}
          nome={nome}
          className={botaoDeIcone}
        />
      </div>
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
  const codigo = codigoDoAluno(sessao.id);
  const linkDoCurso = `/professor/cursos/${aula.modulos.curso_id}`;

  return (
    <>
      {/* Cabeçalho: título, selo e quantidade de blocos; à direita, abrir
          como aluno, editar o título (painel lateral) e publicar. */}
      <LinhaDeVoltar href={linkDoCurso} rotulo="Voltar ao curso">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-bold break-words text-texto-secundario">
              {aula.modulos.cursos.titulo} · {aula.modulos.titulo}
            </p>
            <h1 className="font-titulo text-3xl break-words text-texto md:text-5xl">
              {aula.titulo}
            </h1>
            <p className="flex flex-wrap items-center gap-2 text-sm text-texto-secundario">
              <Etiqueta publicada={aula.publicada} /> · {blocos.length}{" "}
              {blocos.length === 1 ? "bloco" : "blocos"}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:shrink-0">
            <Link
              href={`/aulas/${aula.id}`}
              className={classesDoBotao("link", "px-2 font-bold text-destaque")}
            >
              Abrir como aluno
            </Link>
            <PainelDeTitulo
              rotulo="Editar aula"
              titulo="Editar aula"
              rotuloDoCampo="Título da aula"
              inicial={aula.titulo}
              textoDoBotao="Salvar"
              acao={renomearAula.bind(null, aula.id)}
              variante="secundario"
              classeDoBotao="sm:w-auto"
            />
            <FormularioDeAcao
              acao={publicarAula.bind(null, aula.id, !aula.publicada)}
            >
              <button
                type="submit"
                className={classesDoBotao(
                  aula.publicada ? "secundario" : "destaque",
                  "sm:w-auto",
                )}
              >
                {aula.publicada ? "Despublicar" : "Publicar"}
              </button>
            </FormularioDeAcao>
          </div>
        </div>
      </LinhaDeVoltar>

      <section
        aria-labelledby="conteudo-da-aula"
        className="space-y-4 rounded-3xl border border-linha bg-superficie p-4 md:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="conteudo-da-aula" className="font-titulo text-2xl text-texto">
            Conteúdo da aula
          </h2>
          {blocos.length > 0 && (
            <PainelDoBloco
              rotulo="Adicionar bloco"
              acao={criarBloco.bind(null, aula.id)}
              codigo={codigo}
            />
          )}
        </div>
        {blocos.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-borda-campo px-4 py-10 text-center">
            <p className="text-lg font-bold text-texto">
              Esta aula ainda não tem conteúdo
            </p>
            <p className="max-w-md text-sm text-texto-secundario">
              Junte textos, vídeos, arquivos, áudios, links e provas na ordem em
              que o aluno vai estudar.
            </p>
            <PainelDoBloco
              rotulo="Adicionar primeiro bloco"
              acao={criarBloco.bind(null, aula.id)}
              codigo={codigo}
            />
          </div>
        ) : (
          <ol className="space-y-2">
            {blocos.map((bloco, indice) => (
              <ItemBloco
                key={bloco.id}
                bloco={bloco}
                posicao={indice + 1}
                primeiro={indice === 0}
                ultimo={indice === blocos.length - 1}
                codigo={codigo}
              />
            ))}
          </ol>
        )}
        <p className="text-sm text-texto-secundario">
          O aluno só vê a aula depois de publicada, e com o curso publicado.
        </p>
      </section>
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
        className={`${CONTEINER} flex max-w-6xl flex-1 flex-col gap-6 py-6 md:gap-8 md:py-10`}
      >
        <Suspense fallback={<p>Carregando…</p>}>
          <EditorDaAula params={params} />
        </Suspense>
      </main>
    </TelaDoProfessor>
  );
}
