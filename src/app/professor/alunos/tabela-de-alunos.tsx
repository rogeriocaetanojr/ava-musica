"use client";

import Link from "next/link";
import { type ReactNode, useState } from "react";
import { classesDoBotao } from "@/components/botao";
import { BarraProgresso } from "@/components/barra-progresso";
import { iniciais } from "@/lib/nomes";

export type LinhaDaTurma = {
  id: string;
  nome: string;
  email: string;
  avatar: string;
  etiqueta: { texto: string; classe: string };
  cursos: { id: string; titulo: string; percentual: number | null }[];
};

// Tira acentos e caixa para a busca achar "joao" em "João".
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

// Cabeçalho com a busca pelo nome e a turma, filtrada no navegador sobre a
// lista já carregada. No computador, pedidos e recusados ficam numa coluna fixa
// à direita; no celular, os pedidos vêm antes da turma e os recusados depois.
export function TabelaDeAlunos({
  linhas,
  pedidos,
  recusados,
}: {
  linhas: LinhaDaTurma[];
  pedidos: ReactNode;
  recusados: ReactNode;
}) {
  const [busca, setBusca] = useState("");
  const termo = normalizar(busca.trim());
  const visiveis = termo
    ? linhas.filter((l) => normalizar(l.nome).includes(termo))
    : linhas;

  return (
    <>
      <div className="flex flex-wrap items-end gap-4">
        <h1 className="mr-auto font-titulo text-4xl text-texto">Alunos</h1>
        <BuscaDeAlunos valor={busca} aoMudar={setBusca} />
        <Link
          href="/professor/alunos/convidar"
          className={classesDoBotao("primario", "sm:w-auto")}
        >
          Convidar aluno
        </Link>
      </div>
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-8">
        <div className="contents lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:flex lg:flex-col lg:gap-6">
          <div className="order-1 lg:order-none">{pedidos}</div>
          <div className="order-3 lg:order-none">{recusados}</div>
        </div>
        <section
          aria-labelledby="turma"
          className="order-2 min-w-0 overflow-hidden rounded-3xl border border-linha bg-superficie lg:col-span-8 lg:col-start-1 lg:row-start-1"
        >
          <h2
            id="turma"
            className="px-6 pt-5 pb-3 font-titulo text-2xl text-texto"
          >
            Turma
          </h2>
          <p role="status" className="sr-only">
            {termo
              ? `${visiveis.length} ${visiveis.length === 1 ? "aluno encontrado" : "alunos encontrados"}`
              : ""}
          </p>
          {linhas.length === 0 ? (
            <p className="px-6 pb-6 text-texto-secundario">
              Nenhum aluno cadastrado ainda.
            </p>
          ) : visiveis.length === 0 ? (
            <p className="px-6 pb-6 text-texto-secundario">
              Nenhum aluno com esse nome.
            </p>
          ) : (
            <div className="overflow-x-auto lg:overflow-visible">
              <table className="w-full min-w-[46rem] text-left text-sm">
                <thead className="border-b border-linha bg-superficie text-xs font-bold text-texto-secundario">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      Aluno
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Cursos
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Progresso
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Situação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-linha">
                  {visiveis.map((linha) => (
                    <tr key={linha.id} className="align-top">
                      <td className="px-6 py-3">
                        <Link
                          href={`/professor/alunos/${linha.id}`}
                          className="flex min-h-12 items-center gap-3 font-bold text-texto hover:underline"
                        >
                          <span
                            aria-hidden="true"
                            className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${linha.avatar}`}
                          >
                            {iniciais(linha.nome)}
                          </span>
                          <span className="min-w-0">
                            <span className="block break-words">
                              {linha.nome}
                            </span>
                            <span className="block text-xs font-normal break-all text-texto-secundario">
                              {linha.email}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        {linha.cursos.length === 0 ? (
                          <span className="flex min-h-12 items-center text-texto-secundario">
                            Sem matrículas
                          </span>
                        ) : (
                          <ul className="space-y-2">
                            {linha.cursos.map((curso) => (
                              <li
                                key={curso.id}
                                className="flex min-h-6 items-center break-words"
                              >
                                {curso.titulo}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {linha.cursos.length === 0 ? (
                          <span
                            aria-label="Sem progresso"
                            className="flex min-h-12 items-center"
                          >
                            —
                          </span>
                        ) : (
                          <ul className="space-y-2">
                            {linha.cursos.map((curso) => (
                              <li
                                key={curso.id}
                                className="flex min-h-6 min-w-36 items-center gap-3"
                              >
                                {curso.percentual === null ? (
                                  <span aria-label="Sem progresso">—</span>
                                ) : (
                                  <>
                                    <div className="flex-1">
                                      <BarraProgresso
                                        percentual={curso.percentual}
                                        rotulo={`Progresso de ${linha.nome} em ${curso.titulo}`}
                                        cor="bordo"
                                        comTexto={false}
                                      />
                                    </div>
                                    <span className="w-10 text-right">
                                      {curso.percentual}%
                                    </span>
                                  </>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-6 py-3 align-middle">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${linha.etiqueta.classe}`}
                        >
                          {linha.etiqueta.texto}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function BuscaDeAlunos({
  valor,
  aoMudar,
}: {
  valor: string;
  aoMudar: (valor: string) => void;
}) {
  return (
    <div className="w-full sm:w-72">
      <label htmlFor="busca-de-alunos" className="sr-only">
        Buscar aluno pelo nome
      </label>
      <div className="relative">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-texto-secundario"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id="busca-de-alunos"
          type="search"
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          placeholder="Buscar pelo nome"
          autoComplete="off"
          className="min-h-14 w-full rounded-xl border border-borda-campo bg-superficie py-3 pr-4 pl-12 text-base text-texto placeholder:text-texto-secundario"
        />
      </div>
    </div>
  );
}
