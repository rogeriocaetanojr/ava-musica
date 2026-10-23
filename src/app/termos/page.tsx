import type { Metadata } from "next";
import Link from "next/link";
import { NOME_DO_AVA, tituloDaPagina, VERSAO_DOS_TERMOS } from "@/lib/site";
import { AvisoRascunho, estiloDoTexto } from "../textos-legais";

export const metadata: Metadata = { title: tituloDaPagina("Termos de uso") };

export default function Termos() {
  return (
    <main className={estiloDoTexto}>
      <h1>Termos de uso</h1>
      <AvisoRascunho versao={VERSAO_DOS_TERMOS} />

      <p>
        A {NOME_DO_AVA} é usada só pelos alunos convidados pelo professor. Ao
        usar o site, o aluno (ou o responsável, para quem tem menos de 12 anos)
        concorda com as regras abaixo.
      </p>

      <h2>O aluno pode</h2>
      <ul>
        <li>Assistir às aulas dos cursos em que está matriculado.</li>
        <li>Baixar os materiais liberados para estudo pessoal.</li>
        <li>Marcar aulas como concluídas e registrar o envio das provas.</li>
        <li>Pedir ao professor a exclusão dos próprios dados.</li>
      </ul>

      <h2>O aluno não pode</h2>
      <ul>
        <li>Emprestar o acesso ou entrar com a conta de outra pessoa.</li>
        <li>
          Copiar, publicar, vender ou repassar os vídeos, partituras, áudios e
          outros materiais do professor, nem os links deles.
        </li>
        <li>Gravar ou divulgar as aulas sem autorização do professor.</li>
        <li>Tentar acessar partes do site ou dados de outros alunos.</li>
      </ul>

      <h2>Material do professor</h2>
      <p>
        Todo o conteúdo das aulas pertence ao professor e serve só para o estudo
        do aluno matriculado. O professor pode mudar, tirar do ar ou reorganizar
        aulas e materiais a qualquer momento.
      </p>

      <h2>Acesso</h2>
      <p>
        O professor pode suspender o acesso de quem descumprir estes termos.
        Quando a matrícula termina, o aluno deixa de ver o curso.
      </p>

      <p>
        Saiba como cuidamos dos dados na{" "}
        <Link href="/privacidade">política de privacidade</Link>.
      </p>
    </main>
  );
}
