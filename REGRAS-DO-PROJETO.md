# Regras do projeto — AVA de Música

## 1. Projeto

Ambiente virtual de aprendizagem (AVA) de um professor de música. O professor organiza cursos por instrumento em módulos e aulas, com vídeos do YouTube, arquivos do Google Drive e provas do Google Forms exibidos dentro da página. O aluno estuda e acompanha o próprio progresso num só lugar.

- **Professor (administrador):** conta única; cria cursos, módulos, aulas e provas, convida e matricula alunos, publica avisos e acompanha o progresso de todos.
- **Aluno:** vê apenas os cursos publicados em que está matriculado, conclui aulas, registra o envio de provas e lê avisos.
- **Público:** de 20 a 30 alunos, com aulas individuais e muito acesso pelo celular. **Há menores de idade**, então o sistema guarda só dados mínimos (nome, e-mail, data de nascimento e progresso), conforme a LGPD.

## 2. Stack

- **Next.js** com App Router, TypeScript em modo `strict` e Tailwind 4
- **Supabase**: Postgres, Auth (Google e link mágico, só por convite) e Row Level Security (RLS)
- **Netlify**: hospedagem, com homologação e produção separadas
- **GitHub Actions**: integração contínua, migrações e rotinas automáticas
- Toda a interface é **em português do Brasil**.

## 3. Documentação

Os guias passo a passo ficam em `guias/`, como o fluxo de deploy, a restauração de backup e outros que surgirem. Toda documentação versionada do projeto deve ir para essa pasta.

## 4. Comandos

| Comando                                    | Para quê                                                                                                                                                      | Situação   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `npm run dev`                              | servidor local em http://localhost:3000                                                                                                                       | disponível |
| `npm run check`                            | roda format:check, lint, typecheck, test e build em sequência, parando no primeiro erro; usar antes de cada commit                                            | disponível |
| `npm run format`                           | formata o código com Prettier                                                                                                                                 | disponível |
| `npm run format:check`                     | confere a formatação sem alterar arquivos                                                                                                                     | disponível |
| `npm run lint`                             | ESLint (`eslint .`)                                                                                                                                           | disponível |
| `npm run typecheck`                        | checagem de tipos (`tsc --noEmit`)                                                                                                                            | disponível |
| `npm test`                                 | testes unitários (`vitest run`)                                                                                                                               | disponível |
| `npm run test:db`                          | testes SQL das regras de acesso contra o Supabase local; com `DATABASE_URL`, contra outro Postgres                                                            | disponível |
| `npm run seed:dev`                         | cria professor@teste.local e aluno@teste.local no Supabase local (recusa rodar fora dele)                                                                     | disponível |
| `npm run test:e2e`                         | testes de ponta a ponta (Playwright) no computador e no celular; recria o banco local e precisa do Supabase local rodando; fica fora do `check` por ser lento | disponível |
| `npm run build`                            | build de produção                                                                                                                                             | disponível |
| `npx supabase start` / `npx supabase stop` | sobe e derruba o Supabase local (requer Docker)                                                                                                               | disponível |
| `npx supabase db reset`                    | recria o banco local aplicando todas as migrações                                                                                                             | disponível |

Com o Supabase local rodando: Studio em http://localhost:54323 e caixa de e-mail de teste em http://localhost:54324.

## 5. Regras que nunca podem ser quebradas

1. **Toda permissão fica no banco (RLS).** As telas não são a proteção; esconder um botão não impede o acesso.
2. **Toda server action começa com `exigirProfessor()` ou `exigirAluno()`.**
3. **A chave `service_role` só aparece em arquivo com `import "server-only"`**, nunca em variável com prefixo `NEXT_PUBLIC_`.
4. **O papel nunca vem dos metadados do usuário.** O gatilho que cria o perfil sempre cria `aluno`.
5. **O banco só muda por migração em `supabase/migrations`.** Uma migração já aplicada nunca é editada: cria-se outra.
6. **Menor de 12 anos só acessa depois do aceite do responsável.**
7. **Nenhum segredo no Git.** Chaves ficam em `.env.local`, que é ignorado; o `.env.example` traz só os nomes das variáveis.
8. **Commits e pushes são feitos manualmente pelo responsável do projeto.**
9. **Material de planejamento interno não entra no repositório.** Documentação versionada fica em `guias/`.

## 6. Armadilhas conhecidas

- **Next.js 16** usa `proxy.ts` no lugar de `middleware.ts`.
- O lint roda com `eslint .`, **não** com `next lint`.
- **Tailwind 4:** uma classe própria que usa `@apply` precisa ser declarada com `@utility`.
- **Login Google para menores de 13 anos** depende do Family Link dos pais; para esses alunos, o caminho padrão é o link mágico por e-mail.
- **`npm install <pacote>` pode apagar o binário nativo do rolldown** (bug do npm com dependências opcionais), e o `npm test` passa a falhar com "Cannot find native binding". Para corrigir, apague `node_modules` e `package-lock.json` e rode `npm install`.

## 7. Jeito de trabalhar

- Desenvolvimento **direto na `main`**, sem ramos nem pull requests.
- **Uma etapa por vez**, com um plano definido antes de escrever código.
- Lint, typecheck, testes e build precisam passar antes de cada commit.
- Commits no padrão Conventional Commits, em português, com o código da etapa no rodapé:

  ```
  feat(auth): adiciona login por convite

  Etapa: P3
  ```

- O histórico nunca é reescrito: nada de `git reset --hard` nem `git push --force`. Para desfazer algo, use `git revert`.

## 8. Andamento

Andamento: o estado de cada etapa fica no ANDAMENTO.md; toda etapa o atualiza, sem datas.
