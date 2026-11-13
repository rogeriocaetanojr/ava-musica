# Deploy

Guia de publicação do site. As seções serão completadas à medida que as etapas de publicação forem feitas.

## Endereço do site (`NEXT_PUBLIC_SITE_URL`)

Os endereços enviados por e-mail ou copiados pelo professor (o link do convite, o link de confirmação de Criar conta e o link de autorização do responsável) são montados com essa variável. Configure-a na Netlify, em **Site configuration → Environment variables**, com o endereço de cada ambiente, sem barra no final:

| Ambiente    | Valor                                  |
| ----------- | -------------------------------------- |
| Homologação | endereço da versão de teste na Netlify |
| Produção    | endereço oficial do site               |

Sem ela, o `npm run build` para com o erro "NEXT_PUBLIC_SITE_URL não está definida", para evitar e-mails com links apontando para `localhost`. No computador, ela fica no `.env.local` (`http://localhost:3000`).

## Senha e confirmação do e-mail

O Supabase local lê estes valores do `supabase/config.toml`. Na nuvem, configure os mesmos à mão **nos dois projetos (homologação e produção)**:

| Onde no painel                                                            | Chave no `config.toml`              | Valor                                                                    |
| ------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| **Authentication → Sign In / Providers → Email**, Minimum password length | `[auth] minimum_password_length`    | 8                                                                        |
| **Authentication → Sign In / Providers → Email**, Password requirements   | `[auth] password_requirements`      | sem exigência                                                            |
| **Authentication → Sign In / Providers → Email**, Confirm email           | `[auth.email] enable_confirmations` | ligado                                                                   |
| **Authentication → Sign In / Providers → Email**, Email OTP Expiration    | `[auth.email] otp_expiry`           | 86400 (24 horas)                                                         |
| **Authentication → URL Configuration**, Redirect URLs                     | `[auth] additional_redirect_urls`   | `<endereço do site>/auth/callback` e `<endereço do site>/auth/confirmar` |

A validade do link de confirmação é a mesma "Email OTP Expiration". Em **Authentication → URL Configuration → Site URL**, use o mesmo endereço de `NEXT_PUBLIC_SITE_URL`: o link do e-mail de confirmação é montado com ele.

## Limites de tentativas do login (D2)

O Supabase local lê esses limites do `supabase/config.toml` (`[auth.rate_limit]`). Na nuvem eles não vêm do arquivo: configure os mesmos valores à mão **nos dois projetos (homologação e produção)**, em **Authentication → Rate Limits** do painel do Supabase.

| Limite no painel                     | Chave no `config.toml` | Valor | Janela                   |
| ------------------------------------ | ---------------------- | ----- | ------------------------ |
| Rate limit for sending emails        | `email_sent`           | 30    | por hora, no projeto     |
| Rate limit for sign ups and sign ins | `sign_in_sign_ups`     | 15    | a cada 5 minutos, por IP |
| Rate limit for token verifications   | `token_verifications`  | 15    | a cada 5 minutos, por IP |

Observações:

- O envio de e-mails na nuvem só aceita o valor acima depois que um SMTP próprio estiver configurado; com o SMTP padrão do Supabase o limite é fixo e bem menor.
- O limite de e-mails do Supabase conta os e-mails de confirmação de Criar conta e os de Esqueci minha senha. Os convites saem pelo SMTP do próprio site, fora desse limite, e têm o limite do site: 20 por hora para o professor, contando os reenvios.
- O login por senha e Criar conta dividem o mesmo limite (`sign_in_sign_ups`): o Supabase não separa os dois. Com 15 a cada 5 minutos por IP, dá no máximo 180 tentativas por hora para cada endereço.
- O limite de verificações conta a abertura dos links de confirmação e dos links de senha nova.
- Quando um limite é atingido, a tela `/login` mostra a mensagem "Muitas tentativas de entrar em pouco tempo…".
- Mudou um valor aqui, mude também no `config.toml` (e vice-versa) e reinicie o Supabase local.

## Login com Google e pedidos de acesso

Nos dois projetos do Supabase (homologação e produção):

1. **Cadastro aberto:** em **Authentication → Sign In / Providers**, deixe **Allow new users to sign up** ligado. É o que permite Criar conta e o pedido pelo Google; quem garante que o pendente não vê nada é a regra de acesso do banco (migração `20261022030000_pedidos_de_acesso.sql`), não o painel.
2. **Google:** ative o provedor Google com o cliente OAuth do ambiente (passo a passo em `guias/login-google.md`). Sem ele, o botão Entrar com Google não funciona; Criar conta e o login por senha continuam.
3. **Criar conta (e-mail e senha):** o site cria a conta com `signUp`, e a conta só vira pedido de acesso depois que a pessoa abre o link de confirmação (`/auth/confirmar`). Em **Authentication → Emails → Templates**, em **Confirm signup**, cole o conteúdo de `supabase/templates/confirmacao.html`, com o assunto "Confirme o seu e-mail na Escola de Música John Meyer". O modelo usa `{{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=email`; com `{{ .ConfirmationURL }}`, a confirmação não passa pelo site e o pedido não chega ao professor.
   **Esqueci minha senha:** em **Reset Password**, cole o conteúdo de `supabase/templates/nova-senha.html`, com o assunto "Crie uma senha nova na Escola de Música John Meyer". O modelo usa `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery`, que abre a tela `/nova-senha`; com `{{ .ConfirmationURL }}`, o link só funciona no mesmo navegador que fez o pedido. O link vale o mesmo tempo da "Email OTP Expiration" (24 horas). Em **Authentication → Sign In / Providers → Email**, deixe **Secure password change** desligado, como no `config.toml`.
4. **Modelos que não são usados:** o convite do aluno sai pelo SMTP do próprio site (Resend), com o link `/convite/<código>`, e o login não usa código por e-mail. Os modelos **Invite user** e **Magic Link** do painel não são usados; se tiverem o texto antigo da escola, volte ao padrão para não confundir.
5. **Hook dos recusados:** em **Authentication → Hooks**, adicione o hook **Before User Created** do tipo **Postgres**, com o schema `public` e a função `antes_de_criar_usuario`. Ele barra por 7 dias o cadastro de quem foi recusado. A função vem da migração `20261023000000_pedido_por_email_e_recusas.sql`; o painel não liga o hook sozinho.

## Captcha do login (Cloudflare Turnstile)

O login por senha, Criar conta e a página do convite passam por um captcha, para ninguém testar senhas em massa, disparar e-mails de confirmação nem criar contas com e-mails de terceiros. O Supabase exige o captcha em todo login por senha, inclusive no que o servidor faz depois de o aluno definir a senha pelo convite. No computador e nos testes são usadas as chaves de teste da Cloudflare, que aprovam sozinhas (a secreta está no `supabase/config.toml` e a do site vai no `.env.local`).

1. Na Cloudflare (conta gratuita), abra **Turnstile → Add widget**. Um widget por ambiente, com o domínio do site (homologação ou produção), no modo **Managed**.
2. Copie a **chave do site** para a Netlify, na variável `NEXT_PUBLIC_TURNSTILE_SITE_KEY` do ambiente. Ela vai para o navegador, então não é secreta. Depois de mudar, publique de novo (a variável entra no build).
3. Copie a **chave secreta** para o Supabase, em **Authentication → Attack Protection → Enable Captcha protection**, com o provedor **Turnstile**. Ela fica só no painel, nunca no repositório nem na Netlify.
4. Ligue as duas coisas juntas: com o captcha ligado no Supabase e sem a chave do site na Netlify, ninguém consegue entrar com senha nem criar conta (a tela avisa que não foi possível confirmar que não é um robô).
5. O captcha não vale para o Google, que tem a própria proteção, nem para o que o servidor faz com a chave de serviço (cadastro do aluno pelo professor e gravação da senha do convite).
6. Quando a política de segurança do navegador (CSP) for criada, ela precisa liberar `https://challenges.cloudflare.com` em `script-src` e `frame-src`.

## Sessão sem validade e fim por falta de uso

O login não fica salvo no aparelho, para alunos, professor e quem entra com o Google:

- os cookies do login são de sessão (sem data de validade) e somem ao fechar o navegador; ao abrir de novo, é preciso entrar de novo com a senha ou com o Google;
- a sessão termina depois de 2 horas sem uso. Isso é feito pelo próprio site (`src/proxy.ts` e `src/lib/sessao.ts`, com o cookie `ultimo-uso`), porque a opção de tempo de inatividade do Supabase (**Authentication → Sessions → Inactivity timeout**) só existe nos planos pagos. Não é preciso mudar nada no painel; se o projeto passar a um plano pago, dá para ligar a opção também, com 2 horas.

## E-mail de aviso ao professor (Resend)

O site manda um e-mail ao professor a cada pedido novo e o convite ao aluno cadastrado pelo professor, pelo SMTP do Resend.

1. Crie a conta no Resend e verifique o domínio do site (registros DNS que o Resend mostra). Sem domínio verificado, o Resend só entrega para o e-mail do dono da conta.
2. Crie uma chave de API com permissão **Sending access**, uma por ambiente.
3. Na Netlify, em **Site configuration → Environment variables**, para cada ambiente:

   | Variável          | Valor                                                       |
   | ----------------- | ----------------------------------------------------------- |
   | `SMTP_HOST`       | `smtp.resend.com`                                           |
   | `SMTP_PORT`       | `465`                                                       |
   | `SMTP_USER`       | `resend`                                                    |
   | `SMTP_PASS`       | a chave de API do Resend (marque como secreta)              |
   | `SMTP_REMETENTE`  | `Escola de Música John Meyer <avisos@<domínio verificado>>` |
   | `EMAIL_PROFESSOR` | o e-mail do professor (em homologação, o de quem testa)     |

4. Sem essas variáveis, o site funciona e os pedidos aparecem no painel, mas o aviso não sai, e o convite também não: a tela Convidar mostra o link com o botão Copiar, para o professor mandar ao aluno de outro jeito.
5. **Mesmo SMTP no Supabase:** use o Resend também como SMTP próprio do Supabase, em **Authentication → Emails → SMTP Settings** (host, porta, usuário e senha iguais). É por ele que saem os e-mails de confirmação de Criar conta, e é o que libera o limite de 30 e-mails por hora da tabela acima.

**Cota do Resend:** o plano gratuito permite 100 e-mails por dia e 3.000 por mês, **somando** os do site e os do Supabase (convites, confirmações de Criar conta e avisos de pedido). Com 20 a 30 alunos isso sobra, mas:

- o limite de 30 e-mails por hora do Supabase vale para as confirmações de Criar conta; os avisos de pedido e os convites saem pelo site, fora desse limite (os convites têm o limite de 20 por hora do site);
- com o cadastro aberto, alguém pode criar muitas contas pelo Google ou em Criar conta para gastar a cota. Cada conta gera um e-mail de confirmação e só um aviso, e o aviso só sai depois de a pessoa abrir o link; o captcha, o limite de 30 e-mails por hora e o limite do Supabase de 15 cadastros a cada 5 minutos por IP seguram o ritmo. Se isso acontecer, recuse os pedidos e considere desligar o cadastro por um tempo;
- acompanhe o uso no painel do Resend. Se passar de 100 por dia, os e-mails do dia param, inclusive as confirmações de conta e os convites.
