import type { Metadata } from "next";
import Link from "next/link";
import { TextoLegal } from "@/components/texto-legal";
import { NOME_DO_AVA, tituloDaPagina } from "@/lib/site";

export const metadata: Metadata = { title: tituloDaPagina("Termos de uso") };

export default function Termos() {
  return (
    <TextoLegal
      titulo="Termos de uso"
      introducao={
        <p>
          A {NOME_DO_AVA} é usada só pelos alunos convidados pelo professor. Ao
          usar o site, o aluno (ou o responsável, para quem tem menos de 12
          anos) concorda com as regras abaixo.
        </p>
      }
      secoes={[
        {
          id: "o-aluno-pode",
          titulo: "O aluno pode",
          conteudo: (
            <ul>
              <li>Assistir às aulas dos cursos em que está matriculado.</li>
              <li>Baixar os materiais liberados para estudo pessoal.</li>
              <li>
                Marcar aulas como concluídas e registrar o envio das provas.
              </li>
              <li>Pedir ao professor a exclusão dos próprios dados.</li>
            </ul>
          ),
        },
        {
          id: "o-aluno-nao-pode",
          titulo: "O aluno não pode",
          conteudo: (
            <ul>
              <li>Emprestar o acesso ou entrar com a conta de outra pessoa.</li>
              <li>
                Copiar, publicar, vender ou repassar os vídeos, partituras,
                áudios e outros materiais do professor, nem os links deles.
              </li>
              <li>Gravar ou divulgar as aulas sem autorização do professor.</li>
              <li>Tentar acessar partes do site ou dados de outros alunos.</li>
            </ul>
          ),
        },
        {
          id: "material-do-professor",
          titulo: "Material do professor",
          conteudo: (
            <p>
              Todo o conteúdo das aulas pertence ao professor e serve só para o
              estudo do aluno matriculado. O professor pode mudar, tirar do ar
              ou reorganizar aulas e materiais a qualquer momento.
            </p>
          ),
        },
        {
          id: "acesso",
          titulo: "Acesso",
          conteudo: (
            <p>
              O professor pode suspender o acesso de quem descumprir estes
              termos. Quando a matrícula termina, o aluno deixa de ver o curso.
            </p>
          ),
        },
      ]}
      fecho={
        <p>
          Saiba como cuidamos dos dados na{" "}
          <Link href="/privacidade">política de privacidade</Link>.
        </p>
      }
    />
  );
}
