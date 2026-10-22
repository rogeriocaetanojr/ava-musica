import Link from "next/link";
import { Suspense } from "react";
import { exigirProfessor } from "@/lib/auth";
import { formatarDataHora } from "@/lib/datas";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { apagarAviso, criarAviso, editarAviso } from "./acoes";
import { BotaoApagar } from "./botao-apagar";
import { FormularioAviso } from "./formulario-aviso";

type Aviso = {
  id: string;
  titulo: string;
  texto: string;
  curso_id: string | null;
  publicado_em: string;
};
type Curso = { id: string; titulo: string };

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
    <>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Novo aviso</h2>
        <FormularioAviso
          acao={criarAviso}
          cursos={listaCursos}
          textoDoBotao="Publicar aviso"
          prefixo="novo"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Avisos publicados</h2>
        {error ? (
          <p role="alert" className="rounded-md bg-red-100 p-3 text-red-800">
            Não foi possível carregar os avisos.
          </p>
        ) : lista.length === 0 ? (
          <p>Nenhum aviso publicado ainda.</p>
        ) : (
          <ul className="space-y-3">
            {lista.map((aviso) => (
              <li
                key={aviso.id}
                className="space-y-2 rounded-md border border-current/30 p-4"
              >
                <h3 className="font-medium break-words">{aviso.titulo}</h3>
                <p className="text-sm">
                  {aviso.curso_id
                    ? `Alunos de ${nomeDoCurso.get(aviso.curso_id) ?? "um curso"}`
                    : "Todos os alunos"}{" "}
                  · {formatarDataHora(aviso.publicado_em)}
                </p>
                <p className="break-words whitespace-pre-line">{aviso.texto}</p>
                <details>
                  <summary className="cursor-pointer py-2 text-sm underline">
                    Editar
                  </summary>
                  <FormularioAviso
                    acao={editarAviso.bind(null, aviso.id)}
                    cursos={listaCursos}
                    inicial={{
                      titulo: aviso.titulo,
                      texto: aviso.texto,
                      curso_id: aviso.curso_id ?? "",
                    }}
                    textoDoBotao="Salvar aviso"
                    prefixo={aviso.id}
                  />
                </details>
                <BotaoApagar
                  apagar={apagarAviso.bind(null, aviso.id)}
                  className="rounded-md border border-current px-3 py-2 text-sm"
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default function AvisosDoProfessor() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8">
      <div className="space-y-2">
        <Link href="/professor" className="text-sm underline">
          ← Painel
        </Link>
        <h1 className="text-2xl font-bold">Avisos</h1>
      </div>
      <Suspense fallback={<p>Carregando…</p>}>
        <Avisos />
      </Suspense>
    </main>
  );
}
