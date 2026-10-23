# Login com Google

Como criar a credencial do Google e ligá-la ao Supabase, no computador e na nuvem.

Quem entra pelo Google sem ter sido cadastrado pelo professor vira um **pedido pendente**: vê a tela "Aguardando liberação do professor" e não acessa nada até o professor liberar no painel. O professor recebe um e-mail a cada pedido novo.

## 1. Criar o projeto no Google Cloud

1. Entre em https://console.cloud.google.com com a conta Google do projeto (a mesma que as duas pessoas responsáveis acessam).
2. No seletor de projetos, no alto da tela, clique em **Novo projeto**. Dê um nome como `ava-musica` e crie.
3. Confira se o projeto novo está selecionado no alto da tela antes de seguir.

## 2. Configurar a tela de consentimento

É a tela em que o Google pergunta ao aluno se ele aceita entrar no site.

1. No menu, abra **APIs e serviços → Tela de permissão OAuth** (em versões novas do console, **Google Auth Platform**). Clique em **Começar** se aparecer.
2. **Informações do app (Branding):**
   - Nome do app: o nome do AVA (o mesmo de `NOME_DO_AVA` em `src/lib/site.ts`).
   - E-mail para suporte do usuário: o e-mail do professor ou do projeto.
3. **Público (Audience):** escolha **Externo**. "Interno" só existe para contas do Google Workspace e deixaria os alunos de fora.
4. **Dados de contato:** um e-mail que receba avisos do Google sobre o projeto.
5. Aceite a política de dados do Google e conclua.
6. Em **Acesso a dados (Data access)**, os escopos `openid`, `.../auth/userinfo.email` e `.../auth/userinfo.profile` bastam. **Não acrescente outros**: com só esses, o Google não exige verificação do app.
7. Na página do app, preencha também o link da política de privacidade (`https://<endereço do site>/privacidade`) e dos termos (`https://<endereço do site>/termos`) e, se pedir, o domínio do site em **Domínios autorizados**.
8. **Status de publicação:** enquanto estiver em **Teste**, só entram os e-mails listados em **Usuários de teste** (até 100), e o login expira em 7 dias. Para os alunos, clique em **Publicar app** (fica "Em produção"). Com só os escopos básicos, a publicação é imediata e não passa por revisão.

## 3. Criar a credencial

1. Abra **APIs e serviços → Credenciais** (ou **Google Auth Platform → Clientes**) e clique em **Criar credenciais → ID do cliente OAuth**.
2. Tipo de aplicativo: **Aplicativo da Web**. Nome: por exemplo `Supabase local` (crie um cliente para cada ambiente, assim um vazamento não afeta os outros).
3. **Origens JavaScript autorizadas:** deixe em branco. Quem conversa com o Google é o Supabase, não o navegador.
4. **URIs de redirecionamento autorizados:** o endereço de retorno do **Supabase** (não o do site):

   | Ambiente    | URI de redirecionamento                                                |
   | ----------- | ---------------------------------------------------------------------- |
   | Computador  | `http://127.0.0.1:54321/auth/v1/callback`                              |
   | Homologação | `https://<ref do projeto de homologação>.supabase.co/auth/v1/callback` |
   | Produção    | `https://<ref do projeto de produção>.supabase.co/auth/v1/callback`    |

   O `<ref>` aparece no painel do Supabase em **Project Settings → General → Project ID**, e o endereço pronto aparece em **Authentication → Sign In / Providers → Google → Callback URL**.

5. Clique em **Criar**. O Google mostra o **ID do cliente** e a **Chave secreta do cliente**. Baixe o JSON ou copie os dois na hora: em contas novas, a chave secreta só aparece inteira uma vez. Se perder, crie outra chave secreta no mesmo cliente.

A chave secreta **nunca** vai para o Git, para o chat nem para variável com prefixo `NEXT_PUBLIC_`.

## 4. Ligar no computador

1. Crie o arquivo `supabase/.env` (ignorado pelo Git) com:

   ```
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<ID do cliente>
   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<chave secreta>
   ```

2. Reinicie o Supabase local: `npx supabase stop` e `npx supabase start`. O `supabase/config.toml` já vem com o Google ligado e o cadastro aberto.
3. Para o aviso ao professor chegar na caixa de teste, acrescente ao `.env.local`:

   ```
   SMTP_HOST=127.0.0.1
   SMTP_PORT=54325
   SMTP_REMETENTE=Escola de Música John Meyer <avisos@teste.local>
   EMAIL_PROFESSOR=professor@teste.local
   ```

4. Suba o site (`npm run dev`), abra http://localhost:3000/login e clique em **Entrar com Google**.

Sem o `supabase/.env`, o botão do Google mostra um erro, mas o código por e-mail continua funcionando.

## 5. Testar o pedido

1. Entre com uma conta Google que não foi cadastrada pelo professor. A tela mostra "Aguardando liberação do professor".
2. Abra a caixa de teste (http://localhost:54324): chega o e-mail "Novo pedido de acesso" para `professor@teste.local`.
3. Entre como professor. Em **Pedidos de acesso**, clique em **Liberar**, informe a data de nascimento e confirme. Para menores de 12, informe também o responsável: você vai para a ficha do aluno, com o link de autorização.
4. Volte à conta do aluno e recarregue: ele vai para os cursos (ou, se for menor de 12, continua esperando o responsável).

Quem entra com o Google segue as mesmas regras de sessão do código por e-mail: o login some ao fechar o navegador e termina depois de 2 horas sem uso.

## 6. Ligar na nuvem

Repita nos dois projetos (homologação e produção), cada um com o seu cliente OAuth:

1. No painel do Supabase, abra **Authentication → Sign In / Providers → Google**, ative, cole o ID do cliente e a chave secreta e salve.
2. Em **Authentication → Sign In / Providers**, deixe **Allow new users to sign up** ligado. Sem isso, o Google recusa quem não foi cadastrado e não existe pedido.
3. Em **Authentication → URL Configuration**, confira o **Site URL** e acrescente `https://<endereço do site>/auth/callback` em **Redirect URLs**.

O restante (SMTP do Resend e variáveis na Netlify) está em `guias/deploy.md`.
