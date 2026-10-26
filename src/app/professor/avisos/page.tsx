import { BotaoVoltar } from "@/components/botao-voltar";
import { TelaDoProfessor } from "@/components/tela-do-professor";
import { CONTEINER } from "@/components/conteiner";
import { Suspense } from "react";
import { exigirProfessor } from "@/lib/auth";
import { formatarDataHora } from "@/lib/datas";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { apagarAviso, criarAviso, editarAviso } from "./acoes";
import { PainelDeRecados } from "./painel-de-recados";

type Aviso = {
  id: string;
  titulo: string;
  texto: string;
  curso_id: string | null;
  publicado_em: string;
};
type Curso = { id: string; titulo: string };

function Cabecalho() {
  return (
    <div className="flex items-center gap-4">
      <BotaoVoltar href="/professor" rotulo="Voltar para Painel" />
      <h1 className="font-titulo text-3xl text-texto md:text-5xl">Recados</h1>
    </div>
  );
}

async function Avisos() {
  await exigirProfessor();

  const supabase = await criarClienteServidor();
  const [{ data: avisos, error }, { data: cursos }] = await Promise.all([
    supabase
      .from("avisos")
      .select("id, titulo, texto, curso_id, publicado_em")
      .order("publicado_em", { ascending: false }),
    supabase.from("cursos").select("id, titulo").order("titulo"),
  ]);
  const listaCursos = (cursos ?? []) as Curso[];
  const nomeDoCurso = new Map(listaCursos.map((c) => [c.id, c.titulo]));
  const lista = (avisos ?? []) as Aviso[];

  return (
    <PainelDeRecados
      cabecalho={<Cabecalho />}
      criar={criarAviso}
      cursos={listaCursos}
      recados={
        error
          ? null
          : lista.map((aviso) => ({
              id: aviso.id,
              titulo: aviso.titulo,
              texto: aviso.texto,
              curso_id: aviso.curso_id,
              destinoEData: `${
                aviso.curso_id
                  ? `Alunos de ${nomeDoCurso.get(aviso.curso_id) ?? "um curso"}`
                  : "Todos os alunos"
              } · ${formatarDataHora(aviso.publicado_em)}`,
              editar: editarAviso.bind(null, aviso.id),
              apagar: apagarAviso.bind(null, aviso.id),
            }))
      }
    />
  );
}

export default function AvisosDoProfessor() {
  return (
    <TelaDoProfessor atual="recados">
      <main
        className={`${CONTEINER} flex max-w-6xl flex-1 flex-col gap-6 py-6 md:gap-8 md:py-10`}
      >
        <Suspense
          fallback={
            <>
              <Cabecalho />
              <p>Carregando…</p>
            </>
          }
        >
          <Avisos />
        </Suspense>
      </main>
    </TelaDoProfessor>
  );
}
