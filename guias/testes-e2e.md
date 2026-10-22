# Testes de ponta a ponta

Os testes em `e2e/` usam o site como o professor e o aluno usariam, no Chromium, com a tela de computador e com a de celular (perfil Pixel 7 do Playwright).

## Rodar

1. Suba o Supabase local: `npx supabase start`.
2. Confira o `.env.local` (ver `guias/login-local.md`).
3. Na primeira vez, instale o navegador: `npx playwright install chromium`.
4. Rode `npm run test:e2e`.

Antes dos testes, o banco local é recriado com `npx supabase db reset` e recebe os usuários de teste (`npm run seed:dev`). **Tudo o que estava no banco local é apagado.** Se o site não estiver rodando em http://localhost:3000, o próprio Playwright sobe o `npm run dev`.

## O que é testado

| Arquivo             | Fluxo                                                                                                                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e/login.spec.ts` | o aluno convidado entra pelo link mágico; um e-mail não convidado é recusado                                                                                                                          |
| `e2e/curso.spec.ts` | o professor cria curso, módulo e aula com texto e vídeo do YouTube, publica e matricula o aluno; o aluno conclui a aula, a barra de progresso vai de 0% a 100% e o professor vê o progresso no painel |

O login lê o e-mail na caixa de teste do Supabase local (http://localhost:54324) pela API dela e abre o link. O endereço pode ser trocado pela variável `MAILPIT_URL`.

## Quando um teste falha

- O relatório mostra o passo que falhou. O rastro fica em `test-results/` e abre com `npx playwright show-trace <arquivo trace.zip>`.
- Para ver o navegador: `npx playwright test --headed`; para um só perfil: `npx playwright test --project=celular`.
- Os seletores usam o papel e o texto visível dos elementos (`getByRole`, `getByLabel`). Se um texto da tela mudar, o teste precisa mudar junto.
