# Deploy

Guia de publicação do site. As seções serão completadas à medida que as etapas de publicação forem feitas.

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
