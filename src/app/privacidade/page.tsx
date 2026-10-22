import type { Metadata } from "next";
import Link from "next/link";
import { NOME_DO_AVA, tituloDaPagina, VERSAO_DOS_TERMOS } from "@/lib/site";
import { AvisoRascunho, estiloDoTexto } from "../textos-legais";

export const metadata: Metadata = {
  title: tituloDaPagina("Política de privacidade"),
};

export default function Privacidade() {
  return (
    <main className={estiloDoTexto}>
      <h1>Política de privacidade</h1>
      <AvisoRascunho versao={VERSAO_DOS_TERMOS} />

      <p>
        O {NOME_DO_AVA} é o site das aulas de música do professor. Aqui
        explicamos, de forma simples, quais dados guardamos, para quê e como
        você pode pedir a exclusão.
      </p>

      <h2>Quais dados guardamos</h2>
      <ul>
        <li>
          <strong>Do aluno:</strong> nome, e-mail e data de nascimento.
        </li>
        <li>
          <strong>Do estudo:</strong> as aulas concluídas e as provas marcadas
          como enviadas, com a data.
        </li>
        <li>
          <strong>Do responsável</strong> (só para alunos com menos de 12 anos):
          nome, e-mail, a data da autorização e a versão deste texto.
        </li>
      </ul>
      <p>
        Não pedimos CPF, endereço, foto nem telefone. As respostas das provas
        ficam no Google Forms do professor, não neste site.
      </p>

      <h2>Para que usamos</h2>
      <ul>
        <li>Nome e e-mail: para o aluno entrar no site e ser identificado.</li>
        <li>
          Data de nascimento: para saber se o aluno tem menos de 12 anos e,
          nesse caso, pedir a autorização do responsável antes do acesso.
        </li>
        <li>Progresso: para o aluno e o professor acompanharem o estudo.</li>
        <li>
          Dados do responsável: para registrar quem autorizou o acesso e quando.
        </li>
      </ul>
      <p>
        Os dados não são vendidos nem usados para propaganda. Não há anúncios
        nem rastreadores de marketing; os vídeos do YouTube são exibidos pelo
        endereço sem cookies de propaganda.
      </p>

      <h2>Quem tem acesso</h2>
      <p>
        Só o professor vê os dados de todos os alunos. Cada aluno vê apenas os
        próprios dados. Os dados ficam guardados num serviço de banco de dados
        com servidores no Brasil.
      </p>

      <h2>Menores de idade</h2>
      <p>
        Alunos com menos de 12 anos só acessam o site depois que um dos pais ou
        responsável autoriza, por um link enviado pelo professor.
      </p>

      <h2>Seus direitos e a exclusão dos dados</h2>
      <p>
        O aluno ou o responsável pode, a qualquer momento, pedir ao professor
        para ver, corrigir ou excluir os dados. A exclusão apaga a conta e todos
        os registros do aluno de uma vez e não pode ser desfeita.
      </p>

      <p>
        Veja também os <Link href="/termos">termos de uso</Link>.
      </p>
    </main>
  );
}
