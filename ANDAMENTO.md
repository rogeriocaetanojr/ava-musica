# Andamento

## Pendente

- [ ] P3 Login por convite
- [ ] P4 Cursos, módulos e aulas
- [ ] P5 Conteúdo da aula
- [ ] P6 Alunos e matrículas
- [ ] P7 Área do aluno
- [ ] P8 Avisos e painel de progresso
- [ ] P9 LGPD e acabamento
- [ ] P10 Proteções extras: limite de tentativas e registro de acessos
- [ ] P11 Testes de ponta a ponta com Playwright
- [ ] R1 Revisão do protótipo e demonstração
- [ ] D1 Contas e acessos
- [ ] D2 Projetos Supabase na nuvem
- [ ] D3 Variáveis de ambiente e segredos
- [ ] D4 Site na Netlify
- [ ] D5 Login Google e e-mail de verdade
- [ ] D6 CI completo e rede de proteção
- [ ] D7 Deploy contínuo e promoção
- [ ] D8 Domínio, DNS e cabeçalhos de segurança
- [ ] D9 Backups
- [ ] D10 Monitoramento
- [ ] D11 LGPD na operação
- [ ] D12 Manual do professor, README e CHANGELOG
- [ ] D13 Go-live com alunos piloto

## Em andamento

## Concluído

- [x] S1 Ferramentas instaladas
- [x] S2 Pasta, Git e documentos do projeto
- [x] S3 Regras do projeto
- [x] P1 Base do projeto
- [x] P2 Banco, regras de acesso e CI mínimo

## Decisões

- P1: o `src/proxy.ts` fica para a P3, porque um arquivo sem a função `proxy` exportada quebra o build.
- P1: `@types/node` está na versão 24, a mesma do Node local e do CI; a 20 conflita com o Vitest 5.
- P1: o layout raiz tipa `children` explicitamente em vez de usar `LayoutProps`, para o `tsc --noEmit` rodar sem os tipos gerados pelo Next.
- P1: depois de `npm uninstall` (ou `npm install <pacote>`), apagar `node_modules` e `package-lock.json` e rodar `npm install`, para não perder o binário nativo do rolldown.
- P2: o menor de 12 sem aceite lê só o próprio perfil (a tela de "aguardando o responsável" precisa do nome) e nada mais.
- P2: os testes de banco extras ficam: anon sem acesso, progresso em nome de outro aluno, aluno criando curso, papel nos metadados ignorado e progresso sem duplicar.
- P2: o `npm run test:db` usa o pacote `pg` (sem depender de `psql`) e lê o banco de `DATABASE_URL`, com o Supabase local como padrão.
