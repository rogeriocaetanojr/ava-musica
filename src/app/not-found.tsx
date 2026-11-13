import type { Metadata } from "next";
import { Suspense } from "react";
import { BotaoVoltar } from "@/components/botao-voltar";
import { ConteudoNaoEncontrado } from "@/components/conteudo-nao-encontrado";
import { TelaDeEntrada } from "@/components/tela-de-entrada";
import { TelaDoAluno } from "@/components/tela-do-aluno";
import { TelaDoProfessor } from "@/components/tela-do-professor";
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

function NaEntrada({ href, rotulo }: { href: string; rotulo: string }) {
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
      <Voltar href={href} rotulo={rotulo} />
    </TelaDeEntrada>
  );
}

// Com login, a página fica dentro da área do papel (cabeçalho e abas do aluno
// ou do professor); sem login, ou antes da tela do nome, no layout da entrada.
async function PaginaConformeSessao() {
  const sessao = await obterSessao();
  if (!sessao)
    return <NaEntrada href="/login" rotulo="Voltar para a entrada" />;
  const destino = destinoDaSessao(sessao);
  if (destino === "/professor")
    return (
      <TelaDoProfessor>
        <ConteudoNaoEncontrado
          href="/professor"
          rotulo="Voltar para o Painel"
        />
      </TelaDoProfessor>
    );
  if (destino === "/cursos")
    return (
      <TelaDoAluno>
        <ConteudoNaoEncontrado
          href="/cursos"
          rotulo="Voltar para Meus cursos"
        />
      </TelaDoAluno>
    );
  const rotulo =
    sessao.papel === "professor"
      ? "Voltar para o Painel"
      : "Voltar para Meus cursos";
  return <NaEntrada href={destino} rotulo={rotulo} />;
}

export default function NaoEncontrada() {
  return (
    <Suspense fallback={<div data-tela-cheia className="flex flex-1" />}>
      <PaginaConformeSessao />
    </Suspense>
  );
}
