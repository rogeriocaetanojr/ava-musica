"use client";

import { useState } from "react";
import { classesDoCampo } from "@/components/campo";
import { PainelLateral } from "@/components/painel-lateral";
import { type AlunoDaColuna, LinhaDoAluno } from "./linha-do-aluno";

// Tira acentos e caixa para a busca achar "joao" em "João".
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

// "Ver mais (+X)" do card de curso: abre o painel lateral com todos os
// alunos do curso, na mesma ordem por atividade recente e no mesmo formato,
// com busca por nome. A rolagem fica só dentro do painel.
export function VerMaisAlunos({
  curso,
  alunos,
  restantes,
}: {
  curso: string;
  // Já ordenados por atividade recente.
  alunos: AlunoDaColuna[];
  restantes: number;
}) {
  return (
    <PainelLateral
      rotulo={`Ver mais (+${restantes})`}
      titulo={curso}
      rotuloAcessivel={`Ver mais ${restantes} ${restantes === 1 ? "aluno" : "alunos"} de ${curso}`}
      botaoProprio={{
        className:
          "inline-flex min-h-10 cursor-pointer items-center rounded-lg px-1 text-xs font-bold text-destaque hover:text-destaque/70",
        conteudo: `Ver mais (+${restantes})`,
      }}
    >
      {() => <ListaCompleta curso={curso} alunos={alunos} />}
    </PainelLateral>
  );
}

function ListaCompleta({
  curso,
  alunos,
}: {
  curso: string;
  alunos: AlunoDaColuna[];
}) {
  const [busca, setBusca] = useState("");
  const termo = normalizar(busca.trim());
  const visiveis = termo
    ? alunos.filter((a) => normalizar(a.nome).includes(termo))
    : alunos;

  return (
    <div className="space-y-3">
      <p className="text-sm text-texto-secundario">
        {alunos.length} {alunos.length === 1 ? "aluno" : "alunos"}, da atividade
        mais recente para a mais antiga.
      </p>
      <label htmlFor="busca-no-curso" className="sr-only">
        Buscar aluno pelo nome
      </label>
      <input
        id="busca-no-curso"
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar pelo nome"
        autoComplete="off"
        className={classesDoCampo()}
      />
      <p role="status" className="sr-only">
        {termo
          ? `${visiveis.length} ${visiveis.length === 1 ? "aluno encontrado" : "alunos encontrados"}`
          : ""}
      </p>
      {visiveis.length === 0 ? (
        <p className="text-sm text-texto-secundario">
          Nenhum aluno com esse nome.
        </p>
      ) : (
        <ul className="space-y-0.5">
          {visiveis.map((aluno) => (
            <LinhaDoAluno key={aluno.id} aluno={aluno} curso={curso} />
          ))}
        </ul>
      )}
    </div>
  );
}
