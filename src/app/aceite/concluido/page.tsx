import type { Metadata } from "next";
import { CONTEINER } from "@/components/conteiner";
import { tituloDaPagina } from "@/lib/site";

export const metadata: Metadata = {
  title: tituloDaPagina("Autorização registrada"),
  robots: { index: false },
};

export default function AceiteConcluido() {
  return (
    <main
      className={`${CONTEINER} flex max-w-xl flex-1 flex-col gap-4 py-8 text-texto`}
    >
      <h1 className="font-titulo text-3xl">
        Obrigado! Autorização registrada.
      </h1>
      <p
        role="status"
        className="rounded-xl bg-linha p-4 text-sm leading-relaxed text-sucesso"
      >
        O aluno já pode entrar com o e-mail e a senha que escolheu pelo link do
        convite. Se o link do convite venceu, peça um novo ao professor.
      </p>
      <p className="text-sm text-texto-secundario">
        Para pedir a exclusão dos dados a qualquer momento, fale com o
        professor.
      </p>
    </main>
  );
}
