# Testes de ponta a ponta

Os testes em `e2e/` usam o site como o professor e o aluno usariam, no Chromium, com a tela de computador e com a de celular (perfil Pixel 7 do Playwright).

## Rodar

1. Suba o Supabase local: `npx supabase start`.
2. Confira o `.env.local` (ver `guias/login-local.md`).
3. Na primeira vez, instale o navegador: `npx playwright install chromium`.
4. Rode `npm run test:e2e`.

Antes dos testes, o banco local é recriado com `npx supabase db reset` e recebe os usuários de teste (`npm run seed:dev`). **Tudo o que estava no banco local é apagado.** O Playwright sempre sobe o próprio `npm run dev` em http://localhost:3100, com a pasta de build `.next-e2e`, e o encerra no fim; o `npm run dev` na porta 3000 pode continuar aberto.

## O que é testado

| Arquivo                   | Fluxo                                                                                                                                                                                                                                                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e/login.spec.ts`       | o aluno convidado entra com e-mail e senha; a tela de login tem senha com botão de mostrar, Entrar com Google e os links Criar conta e Esqueci minha senha; senha errada mostra a mesma mensagem para e-mail com ou sem conta; os cookies do login não têm validade e a sessão termina depois de 2 horas sem uso |
| `e2e/criar-conta.spec.ts` | senha curta é recusada; a conta criada só entra e só aparece para o professor depois do link de confirmação, que leva à espera e vale uma vez; o aviso ao professor chega uma vez; o professor libera e o aluno entra com a senha                                                                                |
| `e2e/convite.spec.ts`     | o professor convida com o e-mail do aluno e um curso; Reenviar convite troca o link e o anterior deixa de valer; o aluno vê o nome, define a senha e entra matriculado; o link usado é recusado; depois de entrar, a ficha não oferece mais o reenvio                                                            |
| `e2e/pedidos.spec.ts`     | o recusado não consegue criar a conta de novo até o professor permitir (só no perfil de computador)                                                                                                                                                                                                              |
| `e2e/seu-nome.spec.ts`    | quem entra sem nome cai na tela "Como você se chama?" antes de qualquer outra; nome em branco ou o e-mail são recusados; o pedido só aparece para o professor depois do nome e mostra o nome; o professor corrige o nome na ficha, com registro em "Últimos acessos", e o aluno liberado vê o nome no perfil     |
| `e2e/curso.spec.ts`       | o professor cria curso, módulo e aula com texto e vídeo do YouTube, publica e matricula o aluno; o aluno conclui a aula, a barra de progresso vai de 0% a 100% e o professor vê o progresso no painel                                                                                                            |

O captcha do login, de Criar conta e do convite usa a chave de teste da Cloudflare, que aprova sozinha; o teste espera o token antes de clicar. Se o site já estiver rodando, o `.env.local` precisa ter `NEXT_PUBLIC_TURNSTILE_SITE_KEY` e, para o aviso ao professor, as variáveis `SMTP_*` e `EMAIL_PROFESSOR` do Mailpit (o Playwright só passa essas variáveis quando ele mesmo sobe o site).

O professor e o aluno de teste entram com a senha do seed (`senha-local-123`). Os links de confirmação de Criar conta e de convite são lidos na caixa de teste do Supabase local (http://localhost:54324) pela API dela. A conta sem nome do teste da tela do nome é criada direto no Auth local, com a chave de serviço que `npx supabase status` informa. Para o fim da sessão por falta de uso, o teste muda o cookie `ultimo-uso` para uma hora antiga, em vez de esperar 2 horas. O endereço pode ser trocado pela variável `MAILPIT_URL`.

## Quando um teste falha

- O relatório mostra o passo que falhou. O rastro fica em `test-results/` e abre com `npx playwright show-trace <arquivo trace.zip>`.
- Para ver o navegador: `npx playwright test --headed`; para um só perfil: `npx playwright test --project=celular`.
- Os seletores usam o papel e o texto visível dos elementos (`getByRole`, `getByLabel`). Se um texto da tela mudar, o teste precisa mudar junto.
