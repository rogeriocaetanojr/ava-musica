import { type ReactNode, Suspense } from "react";
import { AbasDoAluno } from "@/components/abas-do-aluno";
import {
  CabecalhoDoAluno,
  type SecaoDoAluno,
} from "@/components/cabecalho-do-aluno";
import { type FolgaDoRodape, Rodape } from "@/components/rodape";
import { exigirAlunoOuProfessor } from "@/lib/auth";
import { recadosDoAluno } from "@/app/(aluno)/dados";

async function CabecalhoComSessao({ atual }: { atual?: SecaoDoAluno }) {
  const sessao = await exigirAlunoOuProfessor();
  const recados = await recadosDoAluno();
  return (
    <CabecalhoDoAluno
      nome={sessao.nome}
      atual={atual}
      recados={recados}
      professor={sessao.papel === "professor"}
    />
  );
}

// Moldura das subpáginas do aluno: o mesmo cabeçalho e as mesmas abas de Meus
// cursos no lugar da moldura geral do site, que fica só nas páginas públicas.
// Enquanto a sessão carrega, o cabeçalho aparece sem o avatar. Telas com
// rodapé fixo próprio no celular, como a aula, ficam sem as abas.
export function TelaDoAluno({
  atual,
  semAbas = false,
  folgaDoRodape,
  children,
}: {
  atual?: SecaoDoAluno;
  semAbas?: boolean;
  // Telas sem abas com barra de ações fixa no celular.
  folgaDoRodape?: FolgaDoRodape;
  children: ReactNode;
}) {
  return (
    <div data-tela-cheia className="flex min-h-dvh flex-1 flex-col">
      <Suspense fallback={<CabecalhoDoAluno atual={atual} />}>
        <CabecalhoComSessao atual={atual} />
      </Suspense>
      <div className="flex flex-1 flex-col">{children}</div>
      <Rodape largura="max-w-6xl" folga={folgaDoRodape} />
      {!semAbas && <AbasDoAluno atual={atual} />}
    </div>
  );
}
