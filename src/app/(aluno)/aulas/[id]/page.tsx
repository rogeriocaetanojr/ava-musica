import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { type Bloco, BlocoConteudo } from "@/components/bloco-conteudo";
import { BotaoEnviar } from "@/components/botao-enviar";
import { exigirAlunoOuProfessor } from "@/lib/auth";
import { ordenar } from "@/lib/ordem";
import { aulasEmOrdem, type ModuloDoCurso } from "@/lib/progresso";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { ehUuid } from "../../../professor/cursos/validacao";
import {
  avisoPreVisualizacao,
  botaoPrincipal,
  botaoSecundario,
} from "../../estilos";
import { marcarAula, marcarProva } from "./acoes";

type Conteudo = Bloco & { id: string; ordem: number };
type Aula = {
  id: string;
  titulo: string;
  publicada: boolean;
  modulos: {
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
};

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
        <p className="mb-2 text-base font-semibold text-green-800">
          ✓ Prova enviada
        </p>
      )}
      <BotaoEnviar className={enviada ? botaoSecundario : botaoPrincipal}>
        {enviada ? "Desfazer envio" : "Enviei a prova"}
      </BotaoEnviar>
    </form>
  );
}

async function PaginaDaAula({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirAlunoOuProfessor();
  const aluno = sessao.papel === "aluno";
  const { id } = await params;
  if (!ehUuid(id)) notFound();

  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("aulas")
    .select(
      "id, titulo, publicada, modulos (titulo, curso_id, cursos (titulo, publicado)), conteudos (id, tipo, ordem, titulo, texto, url)",
    )
    .eq("id", id)
    .eq("publicada", true)
    .maybeSingle();
  const aula = data as unknown as Aula | null;
  // Para o aluno a RLS já esconde o curso não publicado; o professor
  // pré-visualiza só o que o aluno veria.
  if (!aula || !aula.modulos.cursos.publicado) notFound();

  const [{ data: modulos }, { data: progresso }] = await Promise.all([
    supabase
      .from("modulos")
      .select("id, ordem, aulas (id, titulo, ordem, publicada)")
      .eq("curso_id", aula.modulos.curso_id),
    supabase
      .from("progresso")
      .select("conteudo_id")
      .eq("aluno_id", sessao.id)
      .eq("aula_id", aula.id),
  ]);

  const sequencia = aulasEmOrdem(
    (modulos ?? []) as unknown as ModuloDoCurso<AulaDoCurso>[],
  );
  const posicao = sequencia.findIndex((item) => item.id === aula.id);
  const anterior = posicao > 0 ? sequencia[posicao - 1] : null;
  const seguinte = posicao >= 0 ? (sequencia[posicao + 1] ?? null) : null;

  const marcados = new Set(
    (progresso ?? []).map((linha) => linha.conteudo_id as string | null),
  );
  const concluida = marcados.has(null);
  const blocos = ordenar(aula.conteudos);

  return (
    <>
      <Link
        href={`/cursos/${aula.modulos.curso_id}`}
        className="text-base underline"
      >
        ← {aula.modulos.cursos.titulo}
      </Link>

      {!aluno && (
        <p className={avisoPreVisualizacao}>
          Pré-visualização do aluno. Os botões de concluir não aparecem para
          você.
        </p>
      )}

      <header className="space-y-1">
        <p className="text-base break-words">{aula.modulos.titulo}</p>
        <h1 className="text-2xl font-bold break-words sm:text-3xl">
          {aula.titulo}
        </h1>
        {concluida && (
          <p className="text-base font-semibold text-green-800">
            ✓ Aula concluída
          </p>
        )}
      </header>

      {blocos.length === 0 ? (
        <p className="text-lg">Esta aula ainda não tem conteúdo.</p>
      ) : (
        <div className="space-y-8 text-lg leading-relaxed">
          {blocos.map((bloco) => (
            <BlocoConteudo key={bloco.id} bloco={bloco} email={sessao.email}>
              {aluno && bloco.tipo === "prova" && (
                <BotaoProva
                  aulaId={aula.id}
                  conteudoId={bloco.id}
                  enviada={marcados.has(bloco.id)}
                />
              )}
            </BlocoConteudo>
          ))}
        </div>
      )}

      {aluno && (
        <form action={marcarAula.bind(null, aula.id, !concluida)}>
          <BotaoEnviar
            className={`${concluida ? botaoSecundario : botaoPrincipal} sm:w-full`}
          >
            {concluida ? "Desmarcar conclusão" : "Marcar como concluída"}
          </BotaoEnviar>
        </form>
      )}

      <nav
        aria-label="Navegar entre as aulas"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {anterior && (
          <Link href={`/aulas/${anterior.id}`} className={botaoSecundario}>
            ← Aula anterior
          </Link>
        )}
        {seguinte && (
          <Link
            href={`/aulas/${seguinte.id}`}
            className={`${botaoSecundario} sm:col-start-2`}
          >
            Próxima aula →
          </Link>
        )}
      </nav>
    </>
  );
}

export default function AulaDoAluno({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:py-8">
      <Suspense fallback={<p>Carregando…</p>}>
        <PaginaDaAula params={params} />
      </Suspense>
    </main>
  );
}
