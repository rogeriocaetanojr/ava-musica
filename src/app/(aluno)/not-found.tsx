import type { Metadata } from "next";
import { ConteudoNaoEncontrado } from "@/components/conteudo-nao-encontrado";
import { TelaDoAluno } from "@/components/tela-do-aluno";
import { tituloDaPagina } from "@/lib/site";

export const metadata: Metadata = {
  title: tituloDaPagina("Página não encontrada"),
};

export default function NaoEncontradaDoAluno() {
  return (
    <TelaDoAluno>
      <ConteudoNaoEncontrado href="/cursos" rotulo="Voltar para Meus cursos" />
    </TelaDoAluno>
  );
}
