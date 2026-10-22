# Testar o login no ambiente local

## Preparar

1. Suba o Supabase local: `npx supabase start`.
2. Crie o `.env.local` com os valores de `npx supabase status` (API_URL, ANON_KEY e SERVICE_ROLE_KEY) e `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
3. Crie os usuários de teste: `npm run seed:dev`.
4. Suba o site: `npm run dev`.

Usuários de teste:

| E-mail                  | Papel     | Vai para     |
| ----------------------- | --------- | ------------ |
| `professor@teste.local` | professor | `/professor` |
| `aluno@teste.local`     | aluno     | `/cursos`    |

## Link mágico

1. Abra http://localhost:3000/login, digite um dos e-mails acima e clique em **Enviar link de acesso**.
2. Abra a caixa de e-mail de teste em http://localhost:54324 e entre na mensagem mais recente.
3. Clique no link da mensagem **no mesmo navegador** em que pediu o link (o login guarda um código nesse navegador).
4. O site abre a área do papel do usuário.

Para conferir a recusa, peça o link com um e-mail que não foi convidado: a tela mostra "Este e-mail ainda não foi convidado" e nenhuma mensagem chega à caixa de teste.

O Supabase local limita o envio de e-mails por hora (`email_sent` em `supabase/config.toml`). Se aparecer "Muitas tentativas", espere ou reinicie com `npx supabase stop` e `npx supabase start`.

## Convite de aluno

1. Entre como `professor@teste.local` e abra **Alunos e matrículas**.
2. Cadastre um aluno com 12 anos ou mais. O convite chega na caixa de teste (http://localhost:54324) com o assunto "Seu convite para o AVA de Música".
3. Clique em **Entrar no AVA** (funciona em qualquer navegador). O aluno cai em `/cursos`.

Um aluno com menos de 12 anos não recebe convite: a tela mostra o link de autorização para enviar ao responsável. Se esse aluno entrar pelo link mágico antes da autorização, ele só vê a tela "aguardando o responsável".

Depois de mudar `supabase/config.toml` ou os modelos em `supabase/templates/`, reinicie com `npx supabase stop` e `npx supabase start`.

## Google

Fica desligado no ambiente local. Para ligar, crie um cliente OAuth no Google Cloud com o endereço de retorno `http://127.0.0.1:54321/auth/v1/callback`, coloque `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` e `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` em `supabase/.env`, mude `enabled` para `true` em `[auth.external.google]` e reinicie o Supabase.
