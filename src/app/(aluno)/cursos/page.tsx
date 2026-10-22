import { Suspense } from "react";
import { BotaoSair } from "@/components/botao-sair";
import { exigirAluno } from "@/lib/auth";

async function ListaDeCursos() {
  const sessao = await exigirAluno();

  return (
    <>
      <h1 className="text-2xl font-bold">Olá, {sessao.nome}</h1>
      <p>Seus cursos vão aparecer aqui.</p>
      <BotaoSair />
    </>
  );
}

export default function MeusCursos() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-8">
      <Suspense>
        <ListaDeCursos />
      </Suspense>
    </main>
  );
}
