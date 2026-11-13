import type { Metadata } from "next";
import { Suspense } from "react";
import { BotaoVoltar } from "@/components/botao-voltar";
import { TelaDeEntrada } from "@/components/tela-de-entrada";
import { destinoDaSessao, obterSessao } from "@/lib/auth";
import { tituloDaPagina } from "@/lib/site";

export const metadata: Metadata = {
  title: tituloDaPagina("Página não encontrada"),
};

function Voltar({ href, rotulo }: { href: string; rotulo: string }) {
  return (
    <div className="flex items-center gap-3">
      <BotaoVoltar href={href} rotulo={rotulo} />
      <span aria-hidden="true" className="font-bold text-texto">
        {rotulo}
      </span>
    </div>
  );
}

// O início depende do papel: Meus cursos para o aluno, Painel para o
// professor e a entrada para quem não tem sessão.
async function VoltarAoInicio() {
  const sessao = await obterSessao();
  if (!sessao) return <Voltar href="/login" rotulo="Voltar para a entrada" />;
  const destino = destinoDaSessao(sessao);
  const rotulo =
    sessao.papel === "professor"
      ? "Voltar para o Painel"
      : "Voltar para Meus cursos";
  return <Voltar href={destino} rotulo={rotulo} />;
}

export default function NaoEncontrada() {
  return (
    <TelaDeEntrada
      chamada="Esta página saiu do tom."
      destaque="Volte ao início."
      titulo="Página não encontrada"
      subtitulo="O endereço pode ter mudado ou a página foi removida."
    >
      <p className="leading-normal text-texto-secundario md:hidden">
        O endereço pode ter mudado ou a página foi removida.
      </p>
      <Suspense fallback={<div className="h-12" />}>
        <VoltarAoInicio />
      </Suspense>
    </TelaDeEntrada>
  );
}
