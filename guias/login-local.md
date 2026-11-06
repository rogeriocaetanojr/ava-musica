# Testar o login no ambiente local

## Preparar

1. Suba o Supabase local: `npx supabase start`.
2. Crie o `.env.local` com os valores de `npx supabase status` (API_URL, ANON_KEY e SERVICE_ROLE_KEY), `NEXT_PUBLIC_SITE_URL=http://localhost:3000` e a chave de teste do captcha, `NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA`. Sem ela, o login por senha e Criar conta são recusados pelo captcha.
3. Para o convite do aluno e o aviso ao professor chegarem à caixa de teste, acrescente o SMTP do Mailpit local: `SMTP_HOST=127.0.0.1`, `SMTP_PORT=54325`, `SMTP_REMETENTE=avisos@teste.local` e `EMAIL_PROFESSOR=professor@teste.local`. Sem eles, a tela Convidar mostra o link do convite com o botão Copiar.
4. Crie os usuários de teste: `npm run seed:dev`.
5. Suba o site: `npm run dev`.

Usuários de teste (a senha só existe no Supabase local):

| E-mail                                        | Senha             | Papel           | Vai para      |
| --------------------------------------------- | ----------------- | --------------- | ------------- |
| `professor@teste.local`                       | `senha-local-123` | professor       | `/professor`  |
| `aluno@teste.local`                           | `senha-local-123` | aluno           | `/cursos`     |
| `pedido1@teste.local` e `pedido2@teste.local` | sem senha         | pedido pendente | `/aguardando` |

## Entrar com e-mail e senha

1. Abra http://localhost:3000/login, digite o e-mail e a senha, espere o captcha marcar a caixa sozinho e clique em **Entrar**.
2. O site abre a área do papel do usuário.
3. Com a senha errada, ou com um e-mail sem conta, a tela mostra a mesma mensagem: "E-mail ou senha incorretos…".

A sessão não fica salva: os cookies do login somem ao fechar o navegador, e a sessão termina depois de 2 horas sem uso (também para o professor e para quem entra com o Google). Para testar o fim por falta de uso sem esperar, apague ou altere o cookie `ultimo-uso` nas ferramentas do navegador para um número antigo (como `1`) e recarregue: o site volta ao login com "Sua sessão terminou depois de 2 horas sem uso".

## Criar conta e pedido de acesso

1. Em http://localhost:3000/criar-conta, informe nome completo, um e-mail que não foi cadastrado e uma senha de pelo menos 8 caracteres. A tela mostra "Enviamos um link de confirmação…", a mesma mensagem para e-mail novo ou já cadastrado.
2. Antes de abrir o link, a senha não entra e o pedido **não** aparece no painel do professor.
3. Abra a caixa de e-mail de teste em http://localhost:54324 e clique em **Confirmar meu e-mail**. O site mostra "Aguardando liberação do professor", e o pedido aparece em **Pedidos de acesso**. O aviso ao professor só chega à caixa de teste com as variáveis do passo 3 de Preparar.
4. Libere o pedido, com a data de nascimento (e o responsável, para menor de 12). Entre com o e-mail e a senha: o aluno cai em `/cursos`.
5. Para testar a recusa, crie outra conta e recuse o pedido. Ele vai para **Recusados recentemente**, com uma dica do e-mail (como `p***@t***.local`) e o prazo de 7 dias.
6. Crie a conta de novo com o mesmo e-mail: a tela mostra "Não foi possível pedir acesso agora. Fale com o professor."
7. No painel, clique em **Permitir novo pedido** (ou digite o e-mail em **Permitir novo pedido pelo e-mail**). O e-mail volta a conseguir criar a conta.

O Supabase local limita o envio de e-mails por hora (`email_sent` em `supabase/config.toml`) e as tentativas de login e de criação de conta (`sign_in_sign_ups`). Se aparecer "Muitas tentativas", espere ou reinicie com `npx supabase stop` e `npx supabase start`.

## Convite de aluno

1. Entre como `professor@teste.local` e abra **Alunos e matrículas → Convidar aluno**.
2. Cadastre um aluno com o e-mail dele. O convite chega na caixa de teste (http://localhost:54324) com o assunto "Seu convite para a Escola de Música John Meyer" e o link `/convite/<código>`. Sem o SMTP no `.env.local`, a tela mostra o link com o botão Copiar.
3. Abra o link: a página mostra o nome do aluno e pede a senha. Depois de salvar, o aluno entra liberado e matriculado, em `/cursos`.
4. O link vale 7 dias e uma vez só. Na ficha do aluno, enquanto ele não definir a senha, **Reenviar convite** manda um link novo, e o anterior deixa de valer.

Um aluno com menos de 12 anos também recebe o convite e define a senha, mas só vê a tela "aguardando o responsável" até a autorização. A tela de cadastro mostra o link de autorização para enviar ao responsável.

Depois de mudar `supabase/config.toml` ou os modelos em `supabase/templates/`, reinicie com `npx supabase stop` e `npx supabase start`.

## Google e pedidos de acesso

O Google já vem ligado no `supabase/config.toml`, mas precisa das chaves do cliente OAuth em `supabase/.env`. O passo a passo, do Google Cloud até o teste do pedido, está em `guias/login-google.md`.

Sem o Google configurado, os pedidos pendentes do seed (`pedido1@teste.local` e `pedido2@teste.local`) já aparecem em **Pedidos de acesso** no painel do professor, para testar a liberação e a recusa sem criar contas.
