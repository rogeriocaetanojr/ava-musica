import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { type Bloco, BlocoConteudo } from "@/components/bloco-conteudo";
import { exigirProfessor } from "@/lib/auth";
import { type Direcao, ordenar } from "@/lib/ordem";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { ehUuid } from "../../cursos/validacao";
import { criarBloco, editarBloco, moverBloco, removerBloco } from "./acoes";
import { BotaoRemover } from "./botao-remover";
import { FormularioBloco } from "./formulario-bloco";
import { NOMES_DOS_TIPOS } from "./validacao";

type Conteudo = Bloco & { id: string; ordem: number };
type Aula = {
  id: string;
  titulo: string;
  publicada: boolean;
  modulos: { titulo: string; curso_id: string };
  conteudos: Conteudo[];
};

const botaoPequeno =
  "rounded-md border border-current px-3 py-2 text-sm disabled:opacity-30";

function BotoesDeOrdem({
  mover,
  primeiro,
  ultimo,
}: {
  mover: (direcao: Direcao) => Promise<void>;
  primeiro: boolean;
  ultimo: boolean;
}) {
  return (
    <div className="flex gap-2">
      <form action={mover.bind(null, "subir")}>
        <button
          type="submit"
          disabled={primeiro}
          aria-label="Subir o bloco"
          className={botaoPequeno}
        >
          ↑
        </button>
      </form>
      <form action={mover.bind(null, "descer")}>
        <button
          type="submit"
          disabled={ultimo}
          aria-label="Descer o bloco"
          className={botaoPequeno}
        >
          ↓
        </button>
      </form>
    </div>
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
  return (
    <li className="space-y-4 rounded-md border border-current p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">
          {posicao}. {NOMES_DOS_TIPOS[bloco.tipo]}
        </span>
        <div className="flex gap-2">
          <BotoesDeOrdem
            mover={moverBloco.bind(null, bloco.id)}
            primeiro={primeiro}
            ultimo={ultimo}
          />
          <BotaoRemover
            remover={removerBloco.bind(null, bloco.id)}
            className={botaoPequeno}
          />
        </div>
      </div>

      <BlocoConteudo bloco={bloco} email={email} />

      <details className="rounded-md border border-current/30 p-3">
        <summary className="cursor-pointer text-sm font-medium">Editar</summary>
        <div className="pt-3">
          <FormularioBloco
            acao={editarBloco.bind(null, bloco.id)}
            textoDoBotao="Salvar bloco"
            inicial={bloco}
            email={email}
          />
        </div>
      </details>
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
      "id, titulo, publicada, modulos (titulo, curso_id), conteudos (id, tipo, ordem, titulo, texto, url)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const aula = data as unknown as Aula;
  const blocos = ordenar(aula.conteudos);

  return (
    <>
      <Link
        href={`/professor/cursos/${aula.modulos.curso_id}`}
        className="text-sm underline"
      >
        ← Voltar ao curso
      </Link>

      <header className="space-y-1">
        <p className="text-sm break-words">{aula.modulos.titulo}</p>
        <h1 className="text-2xl font-bold break-words">{aula.titulo}</h1>
        <p className="text-sm">
          {aula.publicada ? "Publicada" : "Rascunho"} · {blocos.length}{" "}
          {blocos.length === 1 ? "bloco" : "blocos"}
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Conteúdo da aula</h2>
        {blocos.length === 0 ? (
          <p>Nenhum bloco ainda. Adicione o primeiro abaixo.</p>
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

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Novo bloco</h2>
        <FormularioBloco
          acao={criarBloco.bind(null, aula.id)}
          textoDoBotao="Adicionar bloco"
          email={sessao.email}
          limparAoSalvar
        />
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
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8">
      <Suspense fallback={<p>Carregando…</p>}>
        <EditorDaAula params={params} />
      </Suspense>
    </main>
  );
}
