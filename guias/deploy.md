# Deploy

Guia de publicação do site. As seções serão completadas à medida que as etapas de publicação forem feitas.

## Endereço do site (`NEXT_PUBLIC_SITE_URL`)

Os endereços enviados por e-mail (a página de login no convite e no código, e o link de autorização do responsável) são montados com essa variável. Configure-a na Netlify, em **Site configuration → Environment variables**, com o endereço de cada ambiente, sem barra no final:

| Ambiente    | Valor                                  |
| ----------- | -------------------------------------- |
| Homologação | endereço da versão de teste na Netlify |
| Produção    | endereço oficial do site               |

Sem ela, o `npm run build` para com o erro "NEXT_PUBLIC_SITE_URL não está definida", para evitar e-mails com links apontando para `localhost`. No computador, ela fica no `.env.local` (`http://localhost:3000`).

## Limites de tentativas do login (D2)

O Supabase local lê esses limites do `supabase/config.toml` (`[auth.rate_limit]`). Na nuvem eles não vêm do arquivo: configure os mesmos valores à mão **nos dois projetos (homologação e produção)**, em **Authentication → Rate Limits** do painel do Supabase.

| Limite no painel                     | Chave no `config.toml` | Valor | Janela                   |
| ------------------------------------ | ---------------------- | ----- | ------------------------ |
| Rate limit for sending emails        | `email_sent`           | 30    | por hora, no projeto     |
| Rate limit for sign ups and sign ins | `sign_in_sign_ups`     | 15    | a cada 5 minutos, por IP |
| Rate limit for token verifications   | `token_verifications`  | 15    | a cada 5 minutos, por IP |

Observações:

- O envio de e-mails na nuvem só aceita o valor acima depois que um SMTP próprio estiver configurado; com o SMTP padrão do Supabase o limite é fixo e bem menor.
- O limite de e-mails vale para o projeto inteiro e conta convites, reenvios e códigos de acesso. O limite de convites do próprio site (20 por hora para o professor) fica abaixo dele, para sobrar espaço para os códigos de acesso dos alunos.
- O Supabase não oferece janela de uma hora para as verificações de código: a janela é de 5 minutos por IP, o que dá no máximo 180 por hora para cada endereço.
- Quando um limite é atingido, a tela `/login` mostra a mensagem "Muitas tentativas de entrar em pouco tempo…".
- Mudou um valor aqui, mude também no `config.toml` (e vice-versa) e reinicie o Supabase local.

## Login com Google e pedidos de acesso

Nos dois projetos do Supabase (homologação e produção):

1. **Cadastro aberto:** em **Authentication → Sign In / Providers**, deixe **Allow new users to sign up** ligado. É o que permite o pedido pelo Google e pelo e-mail; quem garante que o pendente não vê nada é a regra de acesso do banco (migração `20261022030000_pedidos_de_acesso.sql`), não o painel.
2. **Google obrigatório:** ative o provedor Google com o cliente OAuth do ambiente (passo a passo em `guias/login-google.md`). Sem ele, ninguém consegue pedir acesso, só os cadastrados pelo professor entram.
3. **Pedido pelo e-mail (código de 6 dígitos):** o site pede o código com `shouldCreateUser: true` e o confirma na própria tela (`verifyOtp`). Em **Authentication → Emails → Templates**, cole:
   - em **Magic Link**, o conteúdo de `supabase/templates/codigo.html`, com o assunto "Seu código para entrar no AVA de Música";
   - em **Confirm signup**, o de `supabase/templates/confirmacao.html` (o mesmo texto; é o modelo usado no primeiro código de quem ainda não confirmou a conta), com o mesmo assunto;
   - em **Invite user**, o de `supabase/templates/convite.html`, com o assunto "Seu convite para o AVA de Música".

   Os modelos mostram `{{ .Token }}`; se algum ainda tiver `{{ .ConfirmationURL }}` ou `{{ .TokenHash }}`, o e-mail sai com link e o login não funciona. Em **Authentication → Sign In / Providers → Email**, deixe **Email OTP Length** em 6 e **Email OTP Expiration** em 600 segundos (10 minutos), como no `config.toml`.

4. **Login por senha:** o Supabase não tem botão para desligar só a senha com o e-mail ligado. Alguém que crie conta por senha direto na API também vira pedido pendente e pode ser recusado. Com o captcha ligado (abaixo), esse cadastro também passa pelo captcha.
5. **Hook dos recusados:** em **Authentication → Hooks**, adicione o hook **Before User Created** do tipo **Postgres**, com o schema `public` e a função `antes_de_criar_usuario`. Ele barra por 7 dias o cadastro de quem foi recusado. A função vem da migração `20261023000000_pedido_por_email_e_recusas.sql`; o painel não liga o hook sozinho.

## Captcha do login (Cloudflare Turnstile)

O pedido do código por e-mail passa por um captcha, para ninguém disparar e-mails em massa nem criar contas com e-mails de terceiros. No computador e nos testes são usadas as chaves de teste da Cloudflare, que aprovam sozinhas (a secreta está no `supabase/config.toml` e a do site vai no `.env.local`).

1. Na Cloudflare (conta gratuita), abra **Turnstile → Add widget**. Um widget por ambiente, com o domínio do site (homologação ou produção), no modo **Managed**.
2. Copie a **chave do site** para a Netlify, na variável `NEXT_PUBLIC_TURNSTILE_SITE_KEY` do ambiente. Ela vai para o navegador, então não é secreta. Depois de mudar, publique de novo (a variável entra no build).
3. Copie a **chave secreta** para o Supabase, em **Authentication → Attack Protection → Enable Captcha protection**, com o provedor **Turnstile**. Ela fica só no painel, nunca no repositório nem na Netlify.
4. Ligue as duas coisas juntas: com o captcha ligado no Supabase e sem a chave do site na Netlify, ninguém consegue pedir o código (a tela avisa que não foi possível confirmar que não é um robô).
5. O captcha não vale para o Google, que tem a própria proteção, nem para os envios do servidor com a chave de serviço (convites, reenvios e o código enviado depois do aceite).
6. Quando a política de segurança do navegador (CSP) for criada, ela precisa liberar `https://challenges.cloudflare.com` em `script-src` e `frame-src`.

## Sessão sem validade e fim por falta de uso

O login não fica salvo no aparelho, para alunos, professor e quem entra com o Google:

- os cookies do login são de sessão (sem data de validade) e somem ao fechar o navegador; ao abrir de novo, é preciso pedir um código novo ou entrar com o Google;
- a sessão termina depois de 2 horas sem uso. Isso é feito pelo próprio site (`src/proxy.ts` e `src/lib/sessao.ts`, com o cookie `ultimo-uso`), porque a opção de tempo de inatividade do Supabase (**Authentication → Sessions → Inactivity timeout**) só existe nos planos pagos. Não é preciso mudar nada no painel; se o projeto passar a um plano pago, dá para ligar a opção também, com 2 horas.

## E-mail de aviso ao professor (Resend)

O site manda um e-mail ao professor a cada pedido novo, pelo SMTP do Resend.

1. Crie a conta no Resend e verifique o domínio do site (registros DNS que o Resend mostra). Sem domínio verificado, o Resend só entrega para o e-mail do dono da conta.
2. Crie uma chave de API com permissão **Sending access**, uma por ambiente.
3. Na Netlify, em **Site configuration → Environment variables**, para cada ambiente:

   | Variável          | Valor                                                   |
   | ----------------- | ------------------------------------------------------- |
   | `SMTP_HOST`       | `smtp.resend.com`                                       |
   | `SMTP_PORT`       | `465`                                                   |
   | `SMTP_USER`       | `resend`                                                |
   | `SMTP_PASS`       | a chave de API do Resend (marque como secreta)          |
   | `SMTP_REMETENTE`  | `AVA de Música <avisos@<domínio verificado>>`           |
   | `EMAIL_PROFESSOR` | o e-mail do professor (em homologação, o de quem testa) |

4. Sem essas variáveis, o site funciona e os pedidos aparecem no painel, mas o aviso não sai.
5. **Mesmo SMTP no Supabase:** use o Resend também como SMTP próprio do Supabase, em **Authentication → Emails → SMTP Settings** (host, porta, usuário e senha iguais). É o que libera o limite de 30 e-mails por hora da tabela acima.

**Cota do Resend:** o plano gratuito permite 100 e-mails por dia e 3.000 por mês, **somando** os do site e os do Supabase (convites, códigos de acesso e avisos de pedido). Com 20 a 30 alunos isso sobra, mas:

- o limite de 30 e-mails por hora do Supabase continua valendo para os e-mails dele, e os avisos de pedido saem pelo site, fora desse limite;
- com o cadastro aberto, alguém pode criar muitas contas pelo Google ou pelo e-mail para gastar a cota com avisos. Cada conta gera só um aviso, e só depois de a pessoa digitar o código; o captcha, o limite de 30 e-mails por hora (que agora conta também os pedidos pelo e-mail) e o limite do Supabase de 15 cadastros a cada 5 minutos por IP seguram o ritmo. Se isso acontecer, recuse os pedidos e considere desligar o cadastro por um tempo;
- acompanhe o uso no painel do Resend. Se passar de 100 por dia, os e-mails do dia param, inclusive os códigos de acesso dos alunos.
