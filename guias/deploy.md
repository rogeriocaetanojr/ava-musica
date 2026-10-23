# Deploy

Guia de publicação do site. As seções serão completadas à medida que as etapas de publicação forem feitas.

## Endereço do site (`NEXT_PUBLIC_SITE_URL`)

Os links enviados por e-mail (convite, link de acesso e autorização do responsável) são montados com essa variável. Configure-a na Netlify, em **Site configuration → Environment variables**, com o endereço de cada ambiente, sem barra no final:

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
- O limite de e-mails vale para o projeto inteiro e conta convites, reenvios e links de acesso. O limite de convites do próprio site (20 por hora para o professor) fica abaixo dele, para sobrar espaço para os links de acesso dos alunos.
- O Supabase não oferece janela de uma hora para as verificações de código: a janela é de 5 minutos por IP, o que dá no máximo 180 por hora para cada endereço.
- Quando um limite é atingido, a tela `/login` mostra a mensagem "Muitas tentativas de entrar em pouco tempo…".
- Mudou um valor aqui, mude também no `config.toml` (e vice-versa) e reinicie o Supabase local.

## Login com Google e pedidos de acesso

Nos dois projetos do Supabase (homologação e produção):

1. **Cadastro aberto:** em **Authentication → Sign In / Providers**, deixe **Allow new users to sign up** ligado. É o que permite o pedido pelo Google; quem garante que o pendente não vê nada é a regra de acesso do banco (migração `20261022030000_pedidos_de_acesso.sql`), não o painel.
2. **Google obrigatório:** ative o provedor Google com o cliente OAuth do ambiente (passo a passo em `guias/login-google.md`). Sem ele, ninguém consegue pedir acesso, só os cadastrados pelo professor entram.
3. **Link mágico só para cadastrados:** não muda nada no painel; o site pede o link com `shouldCreateUser: false`.
4. **Login por senha:** o Supabase não tem botão para desligar só a senha com o e-mail ligado. Alguém que crie conta por senha direto na API também vira pedido pendente e pode ser recusado.

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

**Cota do Resend:** o plano gratuito permite 100 e-mails por dia e 3.000 por mês, **somando** os do site e os do Supabase (convites, links de acesso e avisos de pedido). Com 20 a 30 alunos isso sobra, mas:

- o limite de 30 e-mails por hora do Supabase continua valendo para os e-mails dele, e os avisos de pedido saem pelo site, fora desse limite;
- com o cadastro aberto, alguém pode criar muitas contas pelo Google para gastar a cota com avisos. Cada conta gera só um aviso, e o limite do Supabase de 15 cadastros a cada 5 minutos por IP segura o ritmo. Se isso acontecer, recuse os pedidos e considere desligar o cadastro por um tempo;
- acompanhe o uso no painel do Resend. Se passar de 100 por dia, os e-mails do dia param, inclusive os links de acesso dos alunos.
