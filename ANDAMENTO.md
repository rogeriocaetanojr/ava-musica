# Andamento

## Pendente

### Telas

- [ ] Conteúdo da aula do professor no computador
- [ ] Alunos do professor no computador
- [x] Alunos do professor no celular
- [x] Recados do professor no computador
- [x] Recados do professor no celular
- [x] Política de privacidade e Termos no computador
- [x] Política de privacidade e Termos no celular
- [ ] Aula do aluno sem restos do visual antigo
- [ ] Telas de espera, bloqueio e nome no visual novo
- [x] Autorização do responsável no visual novo
- [ ] Botões de voltar padronizados e progresso do aluno dentro da ficha
- [ ] Páginas de erro, página não encontrada e carregamento no visual novo
- [ ] E-mails com a cara da escola
- [ ] Botões e campos usando os componentes padrão
- [ ] Arquivos e provas abrindo em nova guia
- [ ] Login com e-mail e senha, criar conta e convite por link
- [ ] Esqueci minha senha, nova senha pelo link do e-mail e Trocar senha no perfil do aluno e do professor
- [ ] Cabeçalho, seta de voltar e trilha iguais nas telas internas
- [ ] Botões e links com pelo menos 48 px para o toque
- [ ] Lista de aulas do professor com o título inteiro
- [ ] Acabamento visual da revisão das telas
- [ ] Rodapés e páginas públicas num só padrão
- [ ] Botão "Entrar com Google" de volta na tela de login: saiu sem querer no commit 2812b27 (que deixou a tela de entrar compacta e também tirou o Google do teste do login); será restaurado depois

### Testes

- [ ] Testes automáticos menos frágeis
- [ ] Nova senha: dois envios seguidos do formulário gravam a mesma senha duas vezes (os dois respondem "senha alterada"). Não abre brecha, mas a rota poderia recusar o segundo
- [ ] Entrada única nos testes e teste de recusa também no celular
- [ ] Teste do bloqueio de aluno
- [ ] Teste da exclusão de aluno
- [x] Teste dos recados
- [x] Teste de ações sem permissão
- [x] Teste automático de acessibilidade
- [x] Testes de ponta a ponta no CI e CI nos pull requests
- [ ] Telas que leem dados e ignoram o erro do Supabase, mostrando a página vazia em vez de um aviso: `src/app/(aluno)/dados.ts` (aulas concluídas, última aula, recados), a aula do aluno, a página do convite e a do aceite, Convidar aluno (lista de cursos), a lista de alunos (último acesso), o conteúdo da aula e o curso do professor, e `obterSessao` em `src/lib/auth.ts`

### Revisão

- [ ] Revisão do protótipo e demonstração para o professor
- [ ] Depois do deploy, conferir num celular de verdade que o teclado não esconde o botão de enviar nos painéis Novo recado, Novo bloco e Pedidos de acesso

### Publicação do site

- [ ] Contas dos serviços criadas e com acesso de duas pessoas
- [ ] Banco de dados na nuvem, com ambientes de teste e de uso real
  - Projetos criados em São Paulo: `ava-staging` (homologação) e `ava-prod` (produção); environments `homologacao`, `producao` (com revisor) e `producao-leitura` cadastrados no GitHub. Migrações aplicadas nos dois.
  - **Secure password change** ligado à mão nos dois projetos (Authentication → Sign In / Providers → Email), como no `config.toml`, que vale só para o Supabase local: é a proteção do S6 no site publicado (veja `guias/deploy.md`).
- [ ] Chaves e configurações secretas guardadas com segurança
- [ ] Site publicado na Netlify, com versão de teste e versão oficial
- [ ] Login com Google e envio de e-mails funcionando de verdade
  - Inclui o cadastro aberto, o Google ligado e o SMTP do Resend para o aviso de pedido novo (veja `guias/deploy.md` e `guias/login-google.md`).
  - Ligar na nuvem o captcha (Cloudflare Turnstile) e o hook que barra recusados por 7 dias, nos dois projetos (veja `guias/deploy.md`).
  - A política de privacidade (versão 3-rascunho) cita o Supabase, o Google, a Cloudflare, o Resend e a Netlify e a transferência internacional; confirmar com cada serviço onde os dados ficam e se o contrato tem cláusulas de proteção de dados antes da revisão jurídica.
- [ ] Verificações automáticas completas a cada mudança no código
  - O CI roda em push e pull request, com e2e, e o workflow `migracoes.yml` aplica as migrações na homologação e, com aprovação, na produção; a primeira aplicação passou nos dois projetos.
- [ ] Pull requests do Dependabot: conferir no diff do `package-lock.json` que os binários opcionais de plataforma (`@rolldown/binding-*` e `lightningcss-*`) continuam lá antes de aceitar (ver a armadilha nas regras do projeto)
- [ ] Publicação automática da versão de teste e promoção para a oficial
- [x] Conferir que os dois projetos da nuvem assinam o JWT com chave assimétrica (conferido: ECC P-256 nos dois) (Project Settings → JWT Keys, ES256 ou RS256), como o Supabase local. Com a chave antiga (HS256), o `getClaims()` do proxy (P1) volta a perguntar ao Auth a cada página: continua correto, só sem a economia
- [ ] Endereço próprio do site
  - Os cabeçalhos de segurança e a CSP já saem do próprio site (S2). Com o endereço próprio, conferir no site publicado que eles chegam iguais e, depois de um tempo no ar sem problemas, avaliar o `preload` do HSTS.
- [ ] Cópias de segurança do banco de dados
  - O workflow `backup.yml` roda na nuvem (primeira execução verde) e a restauração foi testada no banco local (`guias/backup.md`). A `BACKUP_SENHA` fica no environment `producao-leitura` e no gerenciador de senhas.
- [ ] Rotinas automáticas do banco
  - A remoção das contas de Criar conta não confirmadas em 48 horas (D3) é agendada pela própria migração (pg_cron), e o keep-alive (D2) é o workflow `keep-alive.yml`. Conferido: o job do pg_cron está ativo nos dois projetos, e o keep-alive passa nos dois (com a publishable key só no cabeçalho `apikey` e a consulta pela função `eh_professor`, porque a anon não lê tabelas).
- [ ] Alertas quando o site cair ou apresentar erros
  - O envio dos erros do servidor ao Sentry, sem dados pessoais, está pronto (`src/instrumentation.ts`). O projeto do Sentry está criado, com o Data Scrubber e o Prevent Storing of IP Addresses ligados. Quando o site for publicado: pôr `SENTRY_DSN` e `SENTRY_AMBIENTE` na Netlify e criar o monitor de uptime em `<endereço do site>/login` (ver `guias/deploy.md`, "Monitoramento").
- [ ] Cuidados com os dados pessoais no dia a dia, conforme a LGPD
- [ ] Manual do professor e documentação do projeto
- [ ] Lançamento com um primeiro grupo de alunos

## Concluído

### Preparação

- [x] Ferramentas de desenvolvimento instaladas
- [x] Pasta do projeto, controle de versões e documentos iniciais
- [x] Regras do projeto escritas

### Protótipo

- [x] Base do site, com verificação de código, testes e configuração da hospedagem
- [x] Banco de dados com as regras de quem pode ver o quê e verificações automáticas a cada envio de código
- [x] Login dos alunos e do professor por convite, com Google ou código de 6 dígitos por e-mail
- [x] Telas do professor para criar, editar, publicar e reordenar cursos, módulos e aulas
- [x] Conteúdo das aulas: texto, vídeos do YouTube, arquivos do Drive, áudio, links e provas do Google Forms, com pré-visualização
- [x] Cadastro de alunos por convite, matrícula nos cursos e regra para menores de 12 anos
- [x] Área do aluno, com os cursos dele, as aulas, a conclusão de aulas, o envio de provas e o progresso
- [x] Avisos do professor e painel com o progresso de cada aluno
- [x] Autorização do responsável, política de privacidade, termos de uso, exclusão de dados e identidade visual
- [x] Limite de tentativas de login, limite de convites por hora e registro dos acessos aos dados de menores de 18 anos
- [x] Testes automáticos que usam o site como um aluno e um professor usariam, no computador e no celular
- [x] Professor pode bloquear e desbloquear o acesso de um aluno, sem perder os dados nem o progresso
- [x] Aluno sem convite pode pedir acesso entrando com o Google; o professor libera ou recusa no painel e recebe um e-mail a cada pedido novo
- [x] Pedido de acesso também pelo e-mail, com captcha, e bloqueio de 7 dias para quem foi recusado, com a lista "Recusados recentemente" no painel
- [x] Nome do aluno sempre preenchido: tela "Como você se chama?" para quem entra sem nome, e o professor pode corrigir o nome na ficha do aluno

### Telas

- [x] Tela de entrada no computador, com as cores e fontes aprovadas
- [x] Tela de entrada no celular
- [x] Meus cursos no computador
- [x] Meus cursos no celular, com a barra de abas e a página de perfil
- [x] Tela da aula no computador
- [x] Tela da aula no celular
- [x] Painel do professor no computador
- [x] Painel do professor no celular, com a barra de abas do professor
- [x] Convite de aluno no computador
- [x] Convite de aluno no celular
- [x] Curso do aluno no computador
- [x] Curso do aluno no celular, com os módulos recolhíveis e o da próxima aula aberto
- [x] Cursos do professor no computador
- [x] Cursos do professor no celular, com os módulos recolhíveis
- [x] Conteúdo da aula do professor no celular, com o rodapé fixo para adicionar bloco e publicar
- [x] Tema escuro no celular, com a barra do navegador na cor de cada tema e o botão de tema também no perfil e no cabeçalho do professor no celular
- [x] Tema escuro no computador, com um botão de lua (no claro) e sol (no escuro) no cabeçalho do aluno e do professor; sem escolha feita, vale o tema do sistema
- [x] Ajustes da revisão das telas: Meus cursos reorganizado, sem rolagem no computador com até 3 cursos (saudação numa linha, "Continue de onde parou" e recados em destaque com a altura acompanhando a tela, e os cursos lado a lado); card da direita da aula alinhado ao conteúdo e "Ver todos os módulos" menor, à direita e sem sublinhado; botão de concluir a aula sem ícone, neutro e verde quando concluída; login redesenhado (logo grande à esquerda, formulário no centro, violão à direita; no celular, só o logo e o formulário), com o mesmo layout em Criar conta, Esqueci minha senha e Nova senha, sem rolagem

### Correções da auditoria

- [x] B1: painel do professor com o progresso contado no banco (função `progresso_por_curso`), sem o corte de 1000 linhas da API; a ficha do aluno lê os registros em páginas
- [x] Testes de ponta a ponta voltando a passar: o do avatar abre o "Menu da conta" e depois "Meu perfil"; e os testes escondem o selo de desenvolvimento do Next, que no celular cobria o botão "Novo bloco" do rodapé
- [x] S1: link de autorização do responsável guardado só como hash, válido por 7 dias e uma vez só; os links antigos deixaram de valer, e o professor gera um novo na ficha do aluno
- [x] S3: idade, faixa de menor de 12 e papel do perfil não mudam pela API, nem pelo professor nem com a chave de serviço; só pela função que grava a auditoria
- [x] S8: um perfil por e-mail, sem diferença de maiúsculas
- [x] S2: cabeçalhos de segurança em toda resposta (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` e HSTS) e CSP com nonce a cada requisição, sem `'unsafe-inline'` em script, com `frame-ancestors 'none'`
- [x] S4: o bloco de áudio só toca arquivo público do Supabase Storage do próprio site; Drive continua abrindo em nova guia, e a CSP reforça com o `media-src`
- [x] S5: o link da prova leva o código do aluno (8 caracteres do id), e não o e-mail; o professor vê o código na ficha do aluno
- [x] S6: `secure_password_change` ligado no Auth local; na nuvem, falta ligar à mão (ver Publicação do site)
- [x] S7: as rotas POST (`/auth/sair`, `/convite/<código>/definir`, `/aceite/<token>/autorizar` e `/nova-senha/salvar`) recusam com 403 o pedido vindo de outro site
- [x] O teste do painel com mais de 1000 registros apaga o aluno e o curso que criou, mesmo se falhar no meio
- [x] B2 e B6: as server actions e o registro do pedido de acesso conferem o erro do Supabase e mostram uma mensagem na tela; concluir a aula ou marcar a prova que falha não fica marcado e avisa o aluno
- [x] B3: a troca de ordem de módulos, aulas e blocos é feita pela função `mover_item` do banco, numa transação só, com a lista travada: dois cliques rápidos seguidos esperam um pelo outro e a ordem nunca fica pela metade. Roda com as permissões de quem chama (RLS): só o professor muda a ordem
- [x] B8: o professor exclui curso, módulo e aula (função `excluir_item`). A confirmação diz o que vai junto, com os números do banco (`resumo_da_exclusao`): módulos, aulas, blocos, o progresso dos alunos e, no curso, as matrículas e os recados dele. A exclusão fica na auditoria, com o id e o título do item, na mesma transação
- [x] P1: o proxy confere a sessão com `getClaims()` (JWT validado localmente com a chave pública do projeto), e `obterSessao` e `alunoLiberado` são memoizados por requisição (`React.cache`). Idas ao Supabase para a sessão, por página: professor de 3 para 2 (Auth e perfil); aluno de 7 para 3 (Auth, perfil e `aluno_liberado`). O aluno bloqueado com o JWT ainda válido é barrado pelo `getUser` da página e cai no login com o aviso e os cookies apagados; na renovação da sessão, o próprio proxy recusa
- [x] O2: o CI roda em push na `main` e em todo pull request, com um job de ponta a ponta: Supabase local no runner, seed e build de produção (`E2E_PRODUCAO=1` faz o Playwright usar `next build` e `next start`); se falhar, o relatório do Playwright fica nos artefatos
- [x] O4: Dependabot semanal para o npm e para as ações do GitHub, e `npm audit --omit=dev --audit-level=high` no CI
- [x] O7: `src/env.ts` confere todas as variáveis no build de produção e para dizendo qual falta ou está em formato errado; o `.env.example` diz quais são obrigatórias. O `.env.local` de cada computador precisa ter também as do SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_REMETENTE` e `EMAIL_PROFESSOR`) para o `npm run build` passar
- [x] Testes de ponta a ponta novos: aluno reenviando a ação de professor (recusada), recados para todos e por curso, convite vencido e com envio duplo, aceite com envio duplo, nova senha com link inválido, janela vencida e envio duplo, axe-core nas telas principais no computador e no celular e title em todo iframe
- [x] O2 (resto): workflow `migracoes.yml` com `supabase db push` na homologação depois do CI na `main` e na produção só com aprovação (environment `producao` com revisor)
- [x] D1: backup semanal dos dados com `pg_dump`, cifrado, nos artefatos do GitHub por 90 dias (`backup.yml` e `scripts/backup`); `guias/backup.md` explica a restauração, testada no banco local (mesmas contagens, mesma chave das recusas e login funcionando)
- [x] D2: keep-alive duas vezes por semana nos dois ambientes (`keep-alive.yml`)
- [x] D3: as contas de Criar conta não confirmadas em 48 horas são apagadas todo dia às 3h (função `privado.apagar_contas_nao_confirmadas`, agendada pelo pg_cron)
- [x] O3 (código): erros do servidor para o Sentry sem o SDK e sem dados pessoais (`src/lib/monitoramento.ts`); o monitor de uptime e o projeto do Sentry ficam na Publicação do site
