import { type ReactNode, Suspense } from "react";
import { AbasDoProfessor } from "@/components/abas-do-professor";
import {
  CabecalhoDoProfessor,
  type SecaoDoProfessor,
} from "@/components/cabecalho-do-professor";
import { type FolgaDoRodape, Rodape } from "@/components/rodape";
import { exigirProfessor } from "@/lib/auth";

async function CabecalhoComSessao({ atual }: { atual?: SecaoDoProfessor }) {
  const sessao = await exigirProfessor();
  return <CabecalhoDoProfessor nome={sessao.nome} atual={atual} />;
}

// Moldura das subpáginas do professor: o mesmo cabeçalho e as mesmas abas do
// painel no lugar da moldura geral do site, que fica só nas páginas públicas.
// Enquanto a sessão carrega, o cabeçalho aparece sem o avatar. Telas com
// rodapé fixo próprio no celular, como o convite, ficam sem as abas.
export function TelaDoProfessor({
  atual,
  semAbas = false,
  folgaDoRodape,
  children,
}: {
  atual?: SecaoDoProfessor;
  semAbas?: boolean;
  // Telas sem abas com barra de ações fixa no celular.
  folgaDoRodape?: FolgaDoRodape;
  children: ReactNode;
}) {
  return (
    <div data-tela-cheia className="flex min-h-dvh flex-1 flex-col">
      <Suspense fallback={<CabecalhoDoProfessor atual={atual} />}>
        <CabecalhoComSessao atual={atual} />
      </Suspense>
      <div className="flex flex-1 flex-col">{children}</div>
      <Rodape largura="max-w-6xl" folga={folgaDoRodape} />
      {!semAbas && <AbasDoProfessor atual={atual} />}
    </div>
  );
}
