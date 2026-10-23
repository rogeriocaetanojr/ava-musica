# Testar o login no ambiente local

## Preparar

1. Suba o Supabase local: `npx supabase start`.
2. Crie o `.env.local` com os valores de `npx supabase status` (API_URL, ANON_KEY e SERVICE_ROLE_KEY), `NEXT_PUBLIC_SITE_URL=http://localhost:3000` e a chave de teste do captcha, `NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA`. Sem ela, o pedido do código é recusado pelo captcha.
3. Crie os usuários de teste: `npm run seed:dev`.
4. Suba o site: `npm run dev`.

Usuários de teste:

| E-mail                                        | Papel           | Vai para      |
| --------------------------------------------- | --------------- | ------------- |
| `professor@teste.local`                       | professor       | `/professor`  |
| `aluno@teste.local`                           | aluno           | `/cursos`     |
| `pedido1@teste.local` e `pedido2@teste.local` | pedido pendente | `/aguardando` |

## Código por e-mail

1. Abra http://localhost:3000/login, digite um dos e-mails acima, espere o captcha marcar a caixa sozinho e clique em **Entrar**.
2. A tela muda para **Digite o código**. Abra a caixa de e-mail de teste em http://localhost:54324 e entre na mensagem mais recente.
3. Digite o código de 6 dígitos e clique em **Confirmar**. O código vale 10 minutos e uma vez só; **Reenviar código** manda outro (vale sempre o mais novo) e **Usar outro e-mail** volta ao começo.
4. O site abre a área do papel do usuário.

A sessão não fica salva: os cookies do login somem ao fechar o navegador, e a sessão termina depois de 2 horas sem uso (também para o professor e para quem entra com o Google). Para testar o fim por falta de uso sem esperar, apague ou altere o cookie `ultimo-uso` nas ferramentas do navegador para um número antigo (como `1`) e recarregue: o site volta ao login com "Sua sessão terminou depois de 2 horas sem uso".

## Pedido de acesso pelo e-mail

1. Peça o código com um e-mail que não foi cadastrado. A tela mostra a mesma mensagem de quem tem conta ("Enviamos um código…").
2. Antes de digitar o código, o pedido **não** aparece no painel do professor.
3. Digite o código e confirme: o site mostra "Aguardando liberação do professor", e o pedido aparece em **Pedidos de acesso**. O aviso ao professor só chega à caixa de teste com as variáveis `SMTP_*` e `EMAIL_PROFESSOR` no `.env.local` (veja o guia do Google).
4. Recuse o pedido. Ele vai para **Recusados recentemente**, com uma dica do e-mail (como `p***@t***.local`) e o prazo de 7 dias.
5. Peça o código de novo com o mesmo e-mail: a tela mostra "Não foi possível pedir acesso agora. Fale com o professor."
6. No painel, clique em **Permitir novo pedido** (ou digite o e-mail em **Permitir novo pedido pelo e-mail**). O e-mail volta a conseguir pedir acesso.

O Supabase local limita o envio de e-mails por hora (`email_sent` em `supabase/config.toml`). Se aparecer "Muitas tentativas", espere ou reinicie com `npx supabase stop` e `npx supabase start`.

## Convite de aluno

1. Entre como `professor@teste.local` e abra **Alunos e matrículas**.
2. Cadastre um aluno com 12 anos ou mais. O convite chega na caixa de teste (http://localhost:54324) com o assunto "Seu convite para a Escola de Música John Meyer".
3. O convite não traz link nem código: ele explica que o aluno deve abrir a página de login, digitar o e-mail e tocar em **Entrar**. Faça isso e use o código que chega em seguida. O aluno cai em `/cursos`.

Um aluno com menos de 12 anos não recebe convite: a tela mostra o link de autorização para enviar ao responsável. Se esse aluno entrar com o código antes da autorização, ele só vê a tela "aguardando o responsável".

Depois de mudar `supabase/config.toml` ou os modelos em `supabase/templates/`, reinicie com `npx supabase stop` e `npx supabase start`.

## Google e pedidos de acesso

O Google já vem ligado no `supabase/config.toml`, mas precisa das chaves do cliente OAuth em `supabase/.env`. O passo a passo, do Google Cloud até o teste do pedido, está em `guias/login-google.md`.

Sem o Google configurado, dá para ver um pedido pendente com as contas do seed, que já aparecem em **Pedidos de acesso**: entre com o código por e-mail usando `pedido1@teste.local` ou `pedido2@teste.local`. A tela mostra "Aguardando liberação do professor", e a conta aparece em **Pedidos de acesso** no painel do professor. O e-mail de aviso ao professor só chega na caixa de teste com as variáveis `SMTP_*` e `EMAIL_PROFESSOR` no `.env.local` (veja o guia do Google).
