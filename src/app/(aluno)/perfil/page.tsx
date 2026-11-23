import { Suspense } from "react";
import { RodapeInterno } from "@/components/rodape";
import { AbasDoAluno } from "@/components/abas-do-aluno";
import { CabecalhoDoAluno } from "@/components/cabecalho-do-aluno";
import { CartaoDoPerfil } from "@/components/cartao-do-perfil";
import { CONTEINER } from "@/components/conteiner";
import { exigirAlunoOuProfessor } from "@/lib/auth";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import {
  CartaoDoCurso,
  type CursoDoAluno,
  SELECT_DOS_CURSOS,
} from "../cartao-do-curso";
import { aulasConcluidas, recadosDoAluno } from "../dados";
import { salvarNomeDoAluno } from "./acoes";

// Cursos em que o aluno está matriculado: a RLS só devolve os publicados em
// que ele tem matrícula, como na home.
async function cursosMatriculados(): Promise<CursoDoAluno[]> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("cursos")
    .select(SELECT_DOS_CURSOS)
    .eq("publicado", true)
    .order("titulo");
  return (data ?? []) as unknown as CursoDoAluno[];
}

async function PerfilDoAluno() {
  const sessao = await exigirAlunoOuProfessor();
  const professor = sessao.papel === "professor";
  const [recados, cursos, concluidas] = await Promise.all([
    recadosDoAluno(),
    professor ? Promise.resolve([]) : cursosMatriculados(),
    aulasConcluidas(sessao.id),
  ]);

  return (
    <>
      <CabecalhoDoAluno
        nome={sessao.nome}
        atual="perfil"
        recados={recados}
        professor={professor}
      />

      <main
        className={`${CONTEINER} flex max-w-6xl flex-1 flex-col gap-4 py-6 md:gap-6 md:py-8`}
      >
        <h1 className="font-titulo text-4xl text-texto">Meu perfil</h1>

        {/* No computador, as duas colunas têm a mesma altura: o card do perfil
            e a lista de cursos começam e terminam juntos. */}
        <div className="grid gap-6 md:grid-cols-[18rem_minmax(0,1fr)] md:items-stretch lg:gap-8">
          <section aria-labelledby="meus-dados" className="flex flex-col gap-3">
            <h2 id="meus-dados" className="text-sm font-bold text-destaque">
              Meus dados
            </h2>
            <div className="flex-1">
              <CartaoDoPerfil
                sessao={sessao}
                cores="bg-bordo text-sobre-bordo"
                acaoDoNome={salvarNomeDoAluno}
              />
            </div>
          </section>

          {/* Na pré-visualização do professor, a coluna dos cursos não aparece. */}
          {!professor && (
            <section
              aria-labelledby="meus-cursos"
              className="flex flex-col gap-3"
            >
              <h2 id="meus-cursos" className="text-sm font-bold text-destaque">
                Cursos em que estou matriculado
              </h2>
              {cursos.length === 0 ? (
                <p className="flex-1 rounded-2xl border border-linha bg-superficie p-5 text-texto-secundario">
                  Você ainda não está matriculado em nenhum curso.
                </p>
              ) : (
                <ul className="grid flex-1 grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5">
                  {cursos.map((curso, posicao) => (
                    <CartaoDoCurso
                      key={curso.id}
                      curso={curso}
                      posicao={posicao}
                      concluidas={concluidas}
                    />
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </main>
    </>
  );
}

// Meu perfil do aluno: no computador, o card do perfil à esquerda e os
// cursos matriculados à direita; no celular, um embaixo do outro. A troca de
// senha fica no "Esqueci minha senha" do login; o tema e o Sair, no menu da
// conta do cabeçalho.
export default function Perfil() {
  return (
    <div data-tela-cheia className="flex min-h-dvh flex-1 flex-col">
      <div className="flex flex-1 flex-col">
        <Suspense fallback={<p className="p-8">Carregando…</p>}>
          <PerfilDoAluno />
        </Suspense>
      </div>
      <RodapeInterno />
      <AbasDoAluno atual="perfil" />
    </div>
  );
}
