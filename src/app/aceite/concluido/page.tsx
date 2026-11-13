import type { Metadata } from "next";
import { Aviso } from "@/components/aviso";
import { CONTEINER } from "@/components/conteiner";
import { CARTAO_DE_LEITURA, MolduraLegal } from "@/components/texto-legal";
import { tituloDaPagina } from "@/lib/site";

export const metadata: Metadata = {
  title: tituloDaPagina("Autorização registrada"),
  robots: { index: false },
};

export default function AceiteConcluido() {
  return (
    <MolduraLegal titulo="Obrigado! Autorização registrada.">
      <main
        className={`${CONTEINER} flex flex-1 flex-col items-center py-6 md:py-10`}
      >
        <div className={`${CARTAO_DE_LEITURA} w-full`}>
          <Aviso tom="sucesso" role="status">
            <p>
              O aluno já pode entrar com o e-mail e a senha que escolheu pelo
              link do convite. Se o link do convite venceu, peça um novo ao
              professor.
            </p>
          </Aviso>
          <p className="text-texto-secundario">
            Para pedir a exclusão dos dados a qualquer momento, fale com o
            professor.
          </p>
        </div>
      </main>
    </MolduraLegal>
  );
}
