# Testes de ponta a ponta

Os testes em `e2e/` usam o site como o professor e o aluno usariam, no Chromium, com a tela de computador e com a de celular (perfil Pixel 7 do Playwright).

## Rodar

1. Suba o Supabase local: `npx supabase start`.
2. Confira o `.env.local` (ver `guias/login-local.md`).
3. Na primeira vez, instale o navegador: `npx playwright install chromium`.
4. Rode `npm run test:e2e`.

Antes dos testes, o banco local é recriado com `npx supabase db reset` e recebe os usuários de teste (`npm run seed:dev`). **Tudo o que estava no banco local é apagado.** O Playwright sempre sobe o próprio `npm run dev` em http://localhost:3100, com a pasta de build `.next-e2e`, e o encerra no fim; o `npm run dev` na porta 3000 pode continuar aberto.

## O que é testado

| Arquivo                | Fluxo                                                                                                                                                                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `e2e/login.spec.ts`    | o aluno convidado entra com o código do e-mail; a tela de login oferece o e-mail e o Google; código errado mostra o erro e "Usar outro e-mail" volta ao começo; os cookies do login não têm validade e a sessão termina depois de 2 horas sem uso                                                            |
| `e2e/pedidos.spec.ts`  | o pedido pelo e-mail só aparece para o professor depois do código e do nome, o aviso por e-mail traz o nome, pedir de novo não gera outro aviso, e o professor libera; o recusado não consegue pedir de novo até o professor permitir (só no perfil de computador)                                           |
| `e2e/seu-nome.spec.ts` | quem entra sem nome cai na tela "Como você se chama?" antes de qualquer outra; nome em branco ou o e-mail são recusados; o pedido só aparece para o professor depois do nome e mostra o nome; o professor corrige o nome na ficha, com registro em "Últimos acessos", e o aluno liberado vê o nome no perfil |
| `e2e/curso.spec.ts`    | o professor cria curso, módulo e aula com texto e vídeo do YouTube, publica e matricula o aluno; o aluno conclui a aula, a barra de progresso vai de 0% a 100% e o professor vê o progresso no painel                                                                                                        |

O captcha da tela de login usa a chave de teste da Cloudflare, que aprova sozinha; o teste espera o token antes de clicar. Se o site já estiver rodando, o `.env.local` precisa ter `NEXT_PUBLIC_TURNSTILE_SITE_KEY` e, para o aviso ao professor, as variáveis `SMTP_*` e `EMAIL_PROFESSOR` do Mailpit (o Playwright só passa essas variáveis quando ele mesmo sobe o site).

O login lê o e-mail na caixa de teste do Supabase local (http://localhost:54324) pela API dela, tira o código de 6 dígitos e o digita na tela. Para o fim da sessão por falta de uso, o teste muda o cookie `ultimo-uso` para uma hora antiga, em vez de esperar 2 horas. O endereço pode ser trocado pela variável `MAILPIT_URL`.

## Quando um teste falha

- O relatório mostra o passo que falhou. O rastro fica em `test-results/` e abre com `npx playwright show-trace <arquivo trace.zip>`.
- Para ver o navegador: `npx playwright test --headed`; para um só perfil: `npx playwright test --project=celular`.
- Os seletores usam o papel e o texto visível dos elementos (`getByRole`, `getByLabel`). Se um texto da tela mudar, o teste precisa mudar junto.
