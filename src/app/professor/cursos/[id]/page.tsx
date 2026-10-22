import Link from "next/link";
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
  "rounded-md border border-current px-3 py-2 text-sm disabled:opacity-30";

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
          className={botaoPequeno}
        >
          ↑
        </button>
      </form>
      <form action={mover.bind(null, "descer")}>
        <button
          type="submit"
          disabled={ultimo}
          aria-label={`Descer ${nome}`}
          className={botaoPequeno}
        >
          ↓
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
    <li className="space-y-2 rounded-md border border-current/30 p-3">
      <FormularioTitulo
        acao={renomearAula.bind(null, aula.id)}
        rotulo="Título da aula"
        textoDoBotao="Salvar"
        inicial={aula.titulo}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`rounded px-2 py-1 text-xs font-medium ${
              aula.publicada
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {aula.publicada ? "Publicada" : "Rascunho"}
          </span>
          <form action={publicarAula.bind(null, aula.id, !aula.publicada)}>
            <button type="submit" className={botaoPequeno}>
              {aula.publicada ? "Despublicar" : "Publicar"}
            </button>
          </form>
          <Link href={`/professor/aulas/${aula.id}`} className={botaoPequeno}>
            Conteúdo
          </Link>
        </div>
        <BotoesDeOrdem
          mover={moverAula.bind(null, aula.id)}
          primeiro={primeira}
          ultimo={ultima}
          nome={`a aula ${aula.titulo}`}
        />
      </div>
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
    <li className="space-y-4 rounded-md border border-current p-3 sm:p-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">Módulo {posicao}</h3>
          <BotoesDeOrdem
            mover={moverModulo.bind(null, modulo.id)}
            primeiro={primeiro}
            ultimo={ultimo}
            nome={`o módulo ${modulo.titulo}`}
          />
        </div>
        <FormularioTitulo
          acao={renomearModulo.bind(null, modulo.id)}
          rotulo="Título do módulo"
          textoDoBotao="Salvar"
          inicial={modulo.titulo}
        />
      </div>

      {aulas.length === 0 ? (
        <p className="text-sm">Nenhuma aula neste módulo.</p>
      ) : (
        <ol className="space-y-3">
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

      <FormularioTitulo
        acao={criarAula.bind(null, modulo.id)}
        rotulo="Nova aula"
        textoDoBotao="Adicionar"
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
      "id, titulo, instrumento, nivel, descricao, capa_url, publicado, modulos (id, titulo, ordem, aulas (id, titulo, ordem, publicada))",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const curso = data as Curso;
  const modulos = ordenar(curso.modulos);

  return (
    <>
      <h1 className="text-2xl font-bold break-words">{curso.titulo}</h1>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Dados do curso</h2>
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

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Módulos e aulas</h2>
        {modulos.length === 0 ? (
          <p>Nenhum módulo criado ainda.</p>
        ) : (
          <ol className="space-y-4">
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
        <FormularioTitulo
          acao={criarModulo.bind(null, curso.id)}
          rotulo="Novo módulo"
          textoDoBotao="Adicionar"
        />
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
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8">
      <Link href="/professor/cursos" className="text-sm underline">
        ← Cursos
      </Link>
      <Suspense fallback={<p>Carregando…</p>}>
        <EditorDoCurso params={params} />
      </Suspense>
    </main>
  );
}
