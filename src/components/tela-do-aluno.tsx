import { type ReactNode, Suspense } from "react";
import { AbasDoAluno } from "@/components/abas-do-aluno";
import {
  CabecalhoDoAluno,
  type SecaoDoAluno,
} from "@/components/cabecalho-do-aluno";
import { exigirAlunoOuProfessor } from "@/lib/auth";

async function CabecalhoComSessao({ atual }: { atual: SecaoDoAluno }) {
  const sessao = await exigirAlunoOuProfessor();
  return <CabecalhoDoAluno nome={sessao.nome} atual={atual} />;
}

// Moldura das subpáginas do aluno: o mesmo cabeçalho e as mesmas abas de Meus
// cursos no lugar da moldura geral do site, que fica só nas páginas públicas.
// Enquanto a sessão carrega, o cabeçalho aparece sem o avatar.
export function TelaDoAluno({
  atual,
  children,
}: {
  atual: SecaoDoAluno;
  children: ReactNode;
}) {
  return (
    <div data-tela-cheia className="flex flex-1 flex-col">
      <Suspense fallback={<CabecalhoDoAluno atual={atual} />}>
        <CabecalhoComSessao atual={atual} />
      </Suspense>
      {children}
      <AbasDoAluno atual={atual} />
    </div>
  );
}
