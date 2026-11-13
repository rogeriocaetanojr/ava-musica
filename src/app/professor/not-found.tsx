import type { Metadata } from "next";
import { ConteudoNaoEncontrado } from "@/components/conteudo-nao-encontrado";
import { TelaDoProfessor } from "@/components/tela-do-professor";
import { tituloDaPagina } from "@/lib/site";

export const metadata: Metadata = {
  title: tituloDaPagina("Página não encontrada"),
};

export default function NaoEncontradaDoProfessor() {
  return (
    <TelaDoProfessor>
      <ConteudoNaoEncontrado href="/professor" rotulo="Voltar para o Painel" />
    </TelaDoProfessor>
  );
}
