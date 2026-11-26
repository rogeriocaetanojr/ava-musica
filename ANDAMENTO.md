# Andamento

## Pendente

### Telas

- [x] Conteúdo da aula do professor no computador
- [x] Alunos do professor no computador
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
  - Todos os e-mails no mesmo layout enxuto (`montarHtml` em `src/lib/email.ts` e os modelos de `supabase/templates`): faixa do topo baixa só com "Escola John Meyer", uma frase, um botão, uma linha pequena opcional e o rodapé "Escola de Música John Meyer" em letra pequena, até 480 px de largura, sem título no corpo e sem o link por extenso (que fica só no texto puro dos e-mails do app). Pedido de acesso: assunto "Novo pedido de acesso: <nome>", "<nome> (<e-mail>) pediu acesso à escola." e "Ver pedido", que abre `/professor/alunos?pedidos=abrir` a partir de `NEXT_PUBLIC_SITE_URL`. Convite: "<nome>, o professor criou seu acesso à Escola John Meyer.", "Criar minha senha" e a validade em letra pequena. Confirmação de conta: "Confirmar e-mail"; nova senha: "Criar nova senha" com "Se não foi você, ignore este e-mail."; os links dos modelos não mudaram e os assuntos novos estão no `config.toml` e no `guias/deploy.md`
- [ ] E-mails com a cara da escola
- [ ] Botões e campos usando os componentes padrão
- [ ] Arquivos e provas abrindo em nova guia
- [ ] Login com e-mail e senha, criar conta e convite por link
- [ ] Esqueci minha senha e nova senha pelo link do e-mail (a troca de senha saiu do perfil)
- [ ] Cabeçalho, seta de voltar e trilha iguais nas telas internas
- [ ] Botões e links com pelo menos 48 px para o toque
- [ ] Lista de aulas do professor com o título inteiro
- [ ] Acabamento visual da revisão das telas
- [ ] Rodapés e páginas públicas num só padrão

### Testes

- [ ] Testes automáticos menos frágeis
- [ ] Nova senha: dois envios seguidos do formulário gravam a mesma senha duas vezes (os dois respondem "senha alterada"). Não abre brecha, mas a rota poderia recusar o segundo
- [ ] Entrada única nos testes e teste de recusa também no celular
- [ ] Teste do bloqueio de aluno
- [ ] Teste da exclusão de aluno
- [ ] Teste automático de acessibilidade também no tema escuro (hoje `e2e/acessibilidade.spec.ts` roda só no claro)
- [ ] Testes de ponta a ponta numa tela de 400 px de largura (o celular dos testes é o Pixel 7, com 412 px)
- [x] Teste dos recados
- [x] Teste de ações sem permissão
- [x] Teste automático de acessibilidade
- [x] Testes de ponta a ponta no CI e CI nos pull requests
- [ ] Telas que leem dados e ignoram o erro do Supabase, mostrando a página vazia em vez de um aviso: `src/app/(aluno)/dados.ts` (aulas concluídas, última aula, recados), a aula do aluno, a página do convite e a do aceite, Convidar aluno (lista de cursos), a lista de alunos (último acesso), o conteúdo da aula e o curso do professor, e `obterSessao` em `src/lib/auth.ts`

### Revisão

- [ ] Depois do deploy, conferir num celular de verdade que o teclado não esconde o botão de enviar nos painéis Novo recado, Novo bloco e Pedidos de acesso

### Publicação do site

- [ ] Contas dos serviços criadas e com acesso de duas pessoas
- [ ] Site publicado na Netlify, com versão de teste e versão oficial
  - O `netlify.toml` tem os contextos `production` (branch `producao`, `ava-prod`) e `branch-deploy` (só a `main`, `ava-staging`), sem deploy previews; o fluxo e as variáveis por contexto estão em `guias/deploy.md`. Falta, no painel: criar o site, o branch `producao`, as variáveis e o domínio na Hostinger.
- [ ] Ativar o envio de e-mails de verdade
  - Inclui o cadastro aberto e o SMTP do Resend para o aviso de pedido novo (veja `guias/deploy.md`).
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

## Decisões

- A entrada com Google fica para uma versão futura.

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

### Revisão

- [x] Revisar segurança e acessibilidade do protótipo
  - Contorno de foco duplo no tema claro (cor do texto com o amarelo por fora), com contraste de pelo menos 3:1 com o fundo; no escuro continua só o amarelo
  - Falha no envio de e-mail registrada só com os códigos do erro, sem o endereço do destinatário
  - `marcarAula` e `marcarProva` começam com `exigirAluno()`

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
- [x] Avatar sem iniciais: quem não tem foto aparece com a silhueta de uma pessoa, no cabeçalho, no painel, na turma e na ficha do aluno (componente `Avatar`)
- [x] Foto de perfil: enviar e trocar pelo lápis da foto no Meu perfil, direto do navegador para o bucket privado `fotos-de-perfil` (migração `20261124000000_fotos_de_perfil.sql`), em `<id>/foto`, só JPG, PNG ou WebP de até 2 MB; a RLS do Storage deixa cada um enviar, trocar e apagar só a própria foto, e o professor ver as dos alunos. As telas mostram a foto por link assinado de 1 hora, gerado no servidor (`src/lib/fotos.ts`), e a CSP aceita imagem do Supabase
- [x] Meu perfil do aluno e do professor refeito: no computador, um card compacto à esquerda (foto com o botão de editar, nome e e-mail) e, à direita, os cursos matriculados com os mesmos cards da home (faixa colorida, título e barra de progresso), as duas colunas com a mesma altura, sem rolagem com até 3 cursos; no celular, um embaixo do outro. O professor vê só o card do perfil. Saíram da tela a troca de senha (fica o "Esqueci minha senha" do login), o botão de tema e o Sair, que ficam no menu da conta do cabeçalho; os testes de ponta a ponta da troca de senha no perfil saíram junto
- [x] Nome editável no Meu perfil: o lápis ao lado do nome abre o campo com Salvar e Cancelar, com a validação da tela do nome (sem vazio, até 120 caracteres); grava pela função `alterar_meu_nome` (migração `20261125000000_alterar_meu_nome.sql`), com as mesmas regras de `definir_meu_nome` para quem já tem nome, e o nome novo aparece no site todo
- [x] Cursos do professor só com os cards; o formulário de novo curso abre num painel lateral à direita (no celular, sobe do rodapé) pelo botão "Novo curso", igual ao de Novo recado
- [x] Pedidos de acesso e recusados recentemente com cards compactos: nome em destaque e, abaixo, e-mail, data do pedido e idade (ou "Informada ao liberar"); na recusa, a dica do e-mail, a data da recusa e até quando vale. "Liberar" e "Confirmar liberação" em verde, "Recusar" e "Confirmar recusa" em vermelho, e os botões de permitir novo pedido em verde. O campo de e-mail dos recusados usa o foco do navegador, sem o contorno amarelo. Cores novas no tema (`botao-sucesso`, `botao-perigo` e o texto sobre elas), com contraste AA nos dois temas
- [x] Página do curso do professor no padrão novo: no topo, o título, o selo Rascunho/Publicado, o botão Publicar/Despublicar e o "Editar curso", que abre o mesmo painel lateral do Novo curso já preenchido (com o Excluir curso no fim); "Módulos e aulas" na largura toda, com o botão "Novo módulo" no cabeçalho do card e o "Nova aula" pequeno em cada módulo, os dois abrindo o painel lateral com o campo de título; cada módulo é um bloco compacto (título com as setas de ordem, editar e excluir à direita, e as aulas em linhas embaixo); sem módulos, o estado vazio "Nenhum módulo ainda" traz o botão "Criar primeiro módulo". O campo da imagem de capa saiu dos formulários de novo curso e de edição (a coluna `capa_url` continua no banco e não é mais tocada ao salvar)
- [x] Página da aula do professor no padrão novo: cabeçalho com a seta de voltar, o curso e o módulo, o título, o selo Rascunho/Publicada e a quantidade de blocos e, à direita, "Abrir como aluno", "Editar aula" (painel lateral com o título) e Publicar/Despublicar; saíram o card "Dados da aula", o card "Como o aluno vê" e o rodapé fixo do celular. Os blocos são cards compactos (ícone do tipo, título, resumo de uma linha e, à direita, setas de ordem, editar e excluir); "Adicionar bloco" e o editar de cada bloco abrem o mesmo painel lateral, com o tipo escolhido por cards com ícone (rádios) e os campos mudando conforme o tipo; sem blocos, o estado vazio traz "Adicionar primeiro bloco"
- [x] Foco discreto nos campos dos painéis laterais: contorno fino de 2 px na cor do texto, no lugar do amarelo grosso, com contraste AA nos dois temas
- [x] Alunos do professor no padrão dos painéis laterais: no cabeçalho, o título e os botões "Pedidos de acesso" (com a contagem), "Recusados" e "Convidar aluno", sem a seta de voltar; a busca e o filtro rápido por situação (Todos, Ativos, Convidados, Bloqueados) logo abaixo. Pedidos e recusados abrem no painel lateral, em linhas compactas, com Liberar (verde) e Recusar (vermelho) no tamanho pequeno e o "Permitir" ao lado do campo de e-mail. A turma ocupa a largura toda, uma linha por aluno (avatar, nome e e-mail; o curso ou "N cursos" com a média do progresso numa barra só; a situação), com hover e a linha toda abrindo a ficha; "Sem matrículas" e "—" mais apagados. Selos: Ativo verde, Convidado neutro, Bloqueado vermelho e Aguardando aceite amarelo. Os botões de sucesso e perigo ficaram saturados também no tema escuro, com texto branco (contraste AA)
- [x] Turma em grade de cards agrupada por situação: "Precisam de atenção" (convidados e aguardando aceite), "Ativos" e "Bloqueados", cada seção com o total e escondida quando vazia; 4 cards por linha em tela grande, 3 em média, 2 em tablet e 1 no celular. Card compacto e todo clicável, com hover suave: avatar neutro e nome, e-mail pequeno e cinza cortado com "...", o curso (ou "N cursos") com a barra fina e a % (sem matrícula, "Sem matrículas" em cinza) e o selo da situação. A busca e o filtro por situação filtram os cards
- [x] Ficha do aluno no padrão novo: cabeçalho com voltar, avatar, nome, selo e, à direita, "Matricular em curso" e o menu "⋯" com Editar nome, Bloquear (ou Desbloquear) acesso e Excluir todos os dados, cada um num painel lateral com o aviso de sempre (a exclusão continua pedindo o nome digitado). À esquerda, um card só com os dados (e-mail, idade, código nas provas, última atividade e como entrou: convite ou pedido) e o do responsável; à direita, só os cursos matriculados em cards compactos com o progresso e o "Desmatricular" discreto, o progresso por aula e os últimos acessos compactos (no máximo 5, com "Ver mais"), com estado vazio numa linha cinza. Saíram o card "Nome", o card "Acesso" e o card grande de exclusão
- [x] Pedido de acesso não tem ficha: sem o "Ver ficha" no painel de Pedidos de acesso e fora da Turma; quem abre `/professor/alunos/<id>` de um pedido pendente volta para Alunos com o painel de pedidos aberto (`?pedidos=abrir`), antes de registrar o acesso na auditoria. Depois de liberado, a pessoa aparece na Turma e tem ficha
- [x] "Precisam de atenção" na Turma também com os ativos sem matrícula (selo "Sem curso") e os parados (selo "Parado há X dias"): sem concluir nenhuma aula há mais de `DIAS_SEM_ATIVIDADE` (14) dias, ou sem nenhuma aula concluída e com a matrícula mais antiga passando desse limite. Cada card mostra até dois motivos lado a lado, na ordem de prioridade (Aguardando aceite, Convidado, Sem curso, Parado), por exemplo Convidado + Sem curso; a seção e a ordenação usam o mais prioritário, e quem está nessa seção não se repete em Ativos (`motivosDeAtencao` em `src/app/professor/alunos/validacao.ts`). Selos de motivo com uma cor cada (Aguardando aceite amarelo, Convidado azul, Sem curso laranja, Parado vermelho suave), fundo suave e texto forte com contraste AA nos dois temas, e um ícone antes do texto (ampulheta, envelope, livro, pausa)
- [x] Painel do professor com o progresso por curso no lugar do "Progresso dos alunos": uma coluna por curso publicado, com o total de alunos e a média da turma, e os alunos (fora os bloqueados) em linhas compactas com avatar, nome, barra fina e "X de Y aulas" ("Concluiu" em verde ao chegar a 100%) (nome e última aula cortados com "…", com o texto inteiro ao passar o mouse) e, embaixo, em cinza, "Parou em: <última aula concluída> · há 1 h" ("Última aula: …" para quem concluiu) ou "Ainda não começou", com o selo "Parado" para quem passou de `DIAS_SEM_ATIVIDADE` dias sem concluir aula no curso. Quem está em dois cursos aparece nas duas colunas. Ordem sempre pela atividade recente: os cursos pela atividade mais recente de algum aluno, os sem atividade depois e os sem alunos por último, e os alunos pela própria atividade, com quem ainda não começou no fim. Cada card com 1/3 da largura a partir de 1024 px, 1/2 de 768 a 1023 px e a largura toda no celular, alinhados à esquerda e sem esticar mesmo com 1 ou 2 cursos; quando todos cabem, setas e pontinhos somem; título do curso numa linha, cortado com "…", com rolagem lateral e snap em cada curso, sem a barra nativa (a rolagem continua pelo touchpad, arrasto e teclado), setas ‹ › ao lado do título (desativadas no começo e no fim) e pontinhos da página. No máximo 3 alunos por card, os de atividade mais recente; com mais, "Ver mais (+X)" abre o painel lateral com todos os alunos do curso, na mesma ordem e no mesmo formato, com busca por nome e rolagem só no painel. Todos os cards têm a mesma altura; o curso sem alunos mostra "Nenhum aluno matriculado" centralizado. Tudo das contagens do banco (`progresso_por_curso`)
- [x] Barra de rolagem personalizada no site todo (página, painéis laterais e listas): fina (8 px), trilho transparente e alça arredondada na cor do tema (cinza-vinho no claro, vinho suave no escuro, com cerca de 3:1 de contraste), mais forte no hover; `scrollbar-width`/`scrollbar-color` no Firefox e `::-webkit-scrollbar` no Chrome, Edge e Safari. A barra continua visível; só a faixa de cursos do painel esconde a dela (classe `sem-barra-de-rolagem`, fora de `@layer` para vencer a regra global)
- [x] Rodapé (Política de privacidade e Termos de uso) só nas telas públicas (login, criar conta, esqueci a senha, nova senha, convite e aceite do responsável) ; dentro do sistema, incluindo Meus cursos e o Painel, fica só o crédito "© 2026 Escola de Música John Meyer", pequeno, cinza e centralizado, sem linha nem fundo, no fim da página (encosta no fim da janela quando o conteúdo é curto e vem depois dele quando é longo), com só o espaço para a barra fixa do celular quando há uma. "Privacidade" e "Termos de uso" entraram, discretos, no menu do avatar, abaixo do Sair, para continuarem a um clique de qualquer tela (LGPD)

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
- [x] O7: `src/lib/env.ts` (antes `src/env.ts`) confere todas as variáveis no build de produção e para dizendo qual falta ou está em formato errado; o `.env.example` diz quais são obrigatórias. O `.env.local` de cada computador precisa ter também as do SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_REMETENTE` e `EMAIL_PROFESSOR`) para o `npm run build` passar
- [x] Testes de ponta a ponta novos: aluno reenviando a ação de professor (recusada), recados para todos e por curso, convite vencido e com envio duplo, aceite com envio duplo, nova senha com link inválido, janela vencida e envio duplo, axe-core nas telas principais no computador e no celular e title em todo iframe
- [x] O2 (resto): workflow `migracoes.yml` com `supabase db push` na homologação depois do CI na `main` e na produção só com aprovação (environment `producao` com revisor)
- [x] D1: backup semanal dos dados com `pg_dump`, cifrado, nos artefatos do GitHub por 90 dias (`backup.yml` e `scripts/backup`); `guias/backup.md` explica a restauração, testada no banco local (mesmas contagens, mesma chave das recusas e login funcionando)
- [x] D2: keep-alive duas vezes por semana nos dois ambientes (`keep-alive.yml`)
- [x] D3: as contas de Criar conta não confirmadas em 48 horas são apagadas todo dia às 3h (função `privado.apagar_contas_nao_confirmadas`, agendada pelo pg_cron)
- [x] O3 (código): erros do servidor para o Sentry sem o SDK e sem dados pessoais (`src/lib/monitoramento.ts`); o monitor de uptime e o projeto do Sentry ficam na Publicação do site

### Publicação do site

- [x] Chaves e configurações secretas guardadas com segurança
  - `src/lib/env.ts` separa as variáveis públicas das de servidor e o build para dizendo qual falta; os valores das de servidor só se leem por `src/lib/env-servidor.ts` (`server-only`). O `.env.example` traz só os nomes e onde cada um fica; a chave secreta do Turnstile fica só no painel do Supabase.
  - O CI roda o gitleaks no histórico inteiro a cada push. Falta ligar no GitHub o push protection de segredos (Settings → Code security).
- [x] Banco de dados na nuvem, com ambientes de teste e de uso real
  - Projetos criados em São Paulo: `ava-staging` (homologação) e `ava-prod` (produção); environments `homologacao`, `producao` (com revisor) e `producao-leitura` cadastrados no GitHub. Migrações aplicadas nos dois.
  - Migrações também pelo computador com `npm run db:push:staging` e `npm run db:push:prod` (`supabase link` e `supabase db push`, com o identificador do projeto em `STAGING_PROJECT_REF` e `PROD_PROJECT_REF`; veja `guias/deploy.md`).
  - **Secure password change** ligado à mão nos dois projetos (Authentication → Sign In / Providers → Email), como no `config.toml`, que vale só para o Supabase local: é a proteção do S6 no site publicado (veja `guias/deploy.md`).
