import { type ReactNode, Suspense } from "react";
import { AbasDoProfessor } from "@/components/abas-do-professor";
import {
  CabecalhoDoProfessor,
  type SecaoDoProfessor,
} from "@/components/cabecalho-do-professor";
import { exigirProfessor } from "@/lib/auth";

async function CabecalhoComSessao({ atual }: { atual: SecaoDoProfessor }) {
  const sessao = await exigirProfessor();
  return <CabecalhoDoProfessor nome={sessao.nome} atual={atual} />;
}

// Moldura das subpáginas do professor: o mesmo cabeçalho e as mesmas abas do
// painel no lugar da moldura geral do site, que fica só nas páginas públicas.
// Enquanto a sessão carrega, o cabeçalho aparece sem o avatar.
export function TelaDoProfessor({
  atual,
  children,
}: {
  atual: SecaoDoProfessor;
  children: ReactNode;
}) {
  return (
    <div data-tela-cheia className="flex flex-1 flex-col">
      <Suspense fallback={<CabecalhoDoProfessor atual={atual} />}>
        <CabecalhoComSessao atual={atual} />
      </Suspense>
      {children}
      <AbasDoProfessor atual={atual} />
    </div>
  );
}
