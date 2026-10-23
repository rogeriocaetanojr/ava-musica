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
          <strong>De quem entra com o Google:</strong> o Google nos informa só o
          nome e o e-mail da conta. Não recebemos foto, contatos nem outros
          dados da conta Google. A data de nascimento não vem do Google: quem
          informa é o professor, ao liberar o acesso.
        </li>
        <li>
          <strong>De quem pede acesso pelo e-mail:</strong> só o e-mail
          digitado. O nome que aparece para o professor é o próprio e-mail, até
          ele liberar o acesso.
        </li>
        <li>
          <strong>De quem teve o pedido recusado:</strong> por 7 dias, um código
          calculado a partir do e-mail, do qual não dá para recuperar o e-mail,
          e uma dica parcial dele (como a***@g***.com), para o professor
          reconhecer a recusa. Depois de 7 dias, os dois são apagados.
        </li>
        <li>
          <strong>Do registro de ações do professor:</strong> quando o professor
          libera, recusa, bloqueia ou desbloqueia um acesso, ou permite um novo
          pedido de quem foi recusado, guardamos qual foi a ação e quando,
          ligada só a um código do aluno, sem nome nem e-mail.
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
          Nome e e-mail de quem pede acesso: para o professor saber quem pediu e
          decidir se libera. Por isso, o professor recebe um e-mail com esses
          dados a cada pedido novo.
        </li>
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

      <h2>Pedido de acesso</h2>
      <p>
        Quem entra com o Google ou pelo link enviado por e-mail sem ter sido
        cadastrado pelo professor fica com um pedido de acesso guardado até o
        professor decidir. O pedido só chega ao professor depois que a pessoa
        clica no link ou volta do Google, para ninguém pedir acesso com o e-mail
        de outra pessoa. Enquanto espera, a pessoa não vê nenhum curso, aula ou
        aviso.
      </p>
      <p>
        Se o professor recusar, a conta e os dados dela são apagados. Fica o
        registro de que houve uma recusa, sem nome nem e-mail, e, por 7 dias, o
        código e a dica do e-mail descritos acima, que impedem um novo pedido
        nesse prazo. O professor pode permitir um novo pedido antes disso.
        Depois de liberado, o professor pode bloquear o acesso a qualquer
        momento, sem apagar o progresso.
      </p>
      <p>
        Uma conta criada pelo link mas nunca confirmada (ninguém clicou no link)
        guarda só o e-mail e não aparece para o professor.
      </p>

      <h2>Quem tem acesso</h2>
      <p>
        Só o professor vê os dados de todos os alunos. Cada aluno vê apenas os
        próprios dados. Para o site funcionar, usamos serviços de outras
        empresas, que tratam os dados só para isso, seguindo as nossas
        instruções:
      </p>
      <ul>
        <li>
          <strong>Supabase:</strong> banco de dados e login, onde ficam todos os
          dados descritos acima.
        </li>
        <li>
          <strong>Google:</strong> o login com a conta Google, para quem escolhe
          entrar assim.
        </li>
        <li>
          <strong>Cloudflare (Turnstile):</strong> a verificação que impede
          robôs de pedir links de acesso em massa. Ela analisa sinais do
          navegador, como o endereço IP, sem cookies de propaganda.
        </li>
        <li>
          <strong>Resend:</strong> envio dos e-mails do site, como os links de
          acesso e o aviso de pedido novo ao professor.
        </li>
        <li>
          <strong>Netlify:</strong> hospedagem do site.
        </li>
      </ul>

      <h2>Transferência internacional de dados</h2>
      <p>
        Alguns desses serviços guardam ou processam dados em servidores fora do
        Brasil, principalmente nos Estados Unidos. É o caso do envio de e-mails,
        que passa pelo nome e pelo e-mail do destinatário, do login com o Google
        e da verificação contra robôs da Cloudflare. Essas transferências são
        feitas só para prestar o serviço do site e com as garantias exigidas
        pela Lei Geral de Proteção de Dados (LGPD), como cláusulas contratuais
        de proteção de dados com cada empresa. Você pode pedir ao professor mais
        informações sobre onde cada serviço guarda os dados.
      </p>

      <h2>Menores de idade</h2>
      <p>
        Alunos com menos de 12 anos só acessam o site depois que um dos pais ou
        responsável autoriza, por um link enviado pelo professor. Isso vale
        também para quem pediu acesso pelo Google ou pelo e-mail: o professor só
        libera depois de informar a data de nascimento e, se for o caso, o
        responsável.
      </p>
      <p>
        O Google só permite que crianças com menos de 13 anos usem uma conta
        Google com o acompanhamento dos pais (Family Link). Para esses alunos, o
        caminho mais simples é o professor fazer o cadastro e o aluno entrar
        pelo link enviado por e-mail.
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
