# Andamento

## Pendente

### Telas

- [ ] Tela da aula no celular
- [ ] Painel do professor no computador
- [ ] Painel do professor no celular
- [ ] Convite de aluno no computador
- [ ] Convite de aluno no celular
- [ ] Tema escuro no computador
- [ ] Tema escuro no celular

### Revisão

- [ ] Revisão do protótipo e demonstração para o professor

### Publicação do site

- [ ] Contas dos serviços criadas e com acesso de duas pessoas
- [ ] Banco de dados na nuvem, com ambientes de teste e de uso real
- [ ] Chaves e configurações secretas guardadas com segurança
- [ ] Site publicado na Netlify, com versão de teste e versão oficial
- [ ] Login com Google e envio de e-mails funcionando de verdade
  - Inclui o cadastro aberto, o Google ligado e o SMTP do Resend para o aviso de pedido novo (veja `guias/deploy.md` e `guias/login-google.md`).
  - Ligar na nuvem o captcha (Cloudflare Turnstile) e o hook que barra recusados por 7 dias, nos dois projetos (veja `guias/deploy.md`).
  - A política de privacidade (versão 3-rascunho) cita o Supabase, o Google, a Cloudflare, o Resend e a Netlify e a transferência internacional; confirmar com cada serviço onde os dados ficam e se o contrato tem cláusulas de proteção de dados antes da revisão jurídica.
- [ ] Verificações automáticas completas a cada mudança no código
- [ ] Publicação automática da versão de teste e promoção para a oficial
- [ ] Endereço próprio do site e proteções de segurança do navegador
  - Na política de segurança do navegador (CSP), liberar o script e o quadro do captcha (`challenges.cloudflare.com`) na tela de login.
  - Na política de segurança do navegador (CSP), limitar de onde o bloco de áudio pode tocar: hoje ele aceita qualquer endereço https (`lerAudio` em `src/lib/embeds.ts`), e o navegador do aluno acessa servidores de terceiros.
- [ ] Cópias de segurança do banco de dados
- [ ] Rotinas automáticas do banco
  - Apagar as contas criadas pelo pedido de código e nunca confirmadas (ninguém digitou o código) depois de 48 horas. Hoje elas só ficam fora da lista do professor e dão lugar ao cadastro feito por ele.
- [ ] Alertas quando o site cair ou apresentar erros
- [ ] Cuidados com os dados pessoais no dia a dia, conforme a LGPD
- [ ] Manual do professor e documentação do projeto
- [ ] Lançamento com um primeiro grupo de alunos

### Pendências

- [ ] Sempre ter o nome do aluno: tela 'Como você se chama?' no pedido pelo código

### Melhorias futuras

- [ ] Professor poder excluir cursos, módulos e aulas

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

### Telas

- [x] Tela de entrada no computador, com as cores e fontes aprovadas
- [x] Tela de entrada no celular
- [x] Meus cursos no computador
- [x] Meus cursos no celular, com a barra de abas e a página de perfil
- [x] Tela da aula no computador
- [x] Tela da aula no celular

## Decisões

- O arquivo que protege as páginas que exigem login (`src/proxy.ts`) só será criado junto com o login, porque vazio ele impede o site de ser gerado.
- Os tipos do Node estão na versão 24, a mesma usada no computador e nas verificações automáticas; a versão 20 é incompatível com a ferramenta de testes.
- O layout principal do site declara os tipos de forma explícita, para a checagem de tipos funcionar sem depender de arquivos gerados pelo Next.js.
- Depois de instalar ou remover um pacote, apague `node_modules` e `package-lock.json` e rode `npm install`, porque um defeito do npm às vezes apaga um arquivo de que os testes precisam.
- O aluno menor de 12 anos ainda sem autorização do responsável vê só o próprio nome, para a tela de espera saber quem ele é; todo o resto fica bloqueado.
- Os testes do banco vão além do mínimo pedido (por exemplo, visitante sem login não vê nada e o aluno não registra progresso em nome de outro), porque cobrem brechas reais.
- Os testes do banco rodam por um script em Node, sem exigir o `psql` instalado, e funcionam tanto no banco local quanto nas verificações automáticas.
- O cadastro aberto fica desligado na configuração geral do login (`[auth] enable_signup = false`). O cadastro por e-mail continua ligado porque, no Supabase local, desligá-lo desativa também o login por código; quem não foi convidado é recusado do mesmo jeito.
- O login com Google fica desligado no Supabase local até existirem chaves do Google; lá o teste é feito pelo código por e-mail.
- O botão de sair envia um formulário em vez de ser um link, para que o navegador não deslogue ninguém ao pré-carregar a página.
- As páginas que leem a sessão ficam dentro de `<Suspense>`, exigência do modo de cache ligado no Next.js.
- O script de usuários de teste só roda quando o endereço do Supabase é local, para nunca criar contas de teste na nuvem.
- A ordem de módulos e aulas muda com botões de subir e descer. A cada clique a lista é renumerada de 0 em diante, o que corrige sozinho ordens repetidas ou com buracos. As gravações não ficam numa transação única; se uma falhar no meio, o próximo clique arruma a ordem.
- O nível do curso é escolhido numa lista (Iniciante, Intermediário, Avançado) ou deixado em branco, para os cursos ficarem com nomes padronizados.
- A capa do curso só aceita links que começam com http:// ou https://, para bloquear endereços perigosos como `javascript:`.
- Os links de conteúdo só aceitam https://. Qualquer outro começo, como `http://` ou `javascript:`, é recusado ao salvar e também ao exibir.
- Os vídeos do YouTube são exibidos pelo endereço youtube-nocookie.com, que não grava cookies de propaganda nos alunos.
- O link da prova é guardado do jeito que o professor colou, com o texto EMAIL_DO_ALUNO. A troca pelo e-mail de quem está logado acontece só na hora de exibir; na pré-visualização do professor entra o e-mail dele.
- Links curtos do Forms (forms.gle) não podem ser exibidos dentro da página, então aparecem como um botão que abre a prova em outra aba, e nesse caso o e-mail não é preenchido sozinho.
- Áudio pode vir do Google Drive (exibido pelo visualizador do Drive) ou de um link direto para o arquivo (tocado pelo próprio navegador).
- O bloco de texto mostra o texto puro, com as quebras de linha, sem formatação, para não abrir brecha para código malicioso.
- A idade é calculada pela data de hoje no horário de Brasília. O aluno faz aniversário no próprio dia; quem nasceu em 29 de fevereiro faz aniversário em 1º de março nos anos que não são bissextos.
- O e-mail de convite foi personalizado (`supabase/templates/convite.html`) para levar um código que o site confere no servidor. O convite padrão do Supabase não funciona com o jeito de login do site.
- O cadastro confere antes se o e-mail já existe. Se gravar o responsável de um menor de 12 falhar, a conta recém-criada é apagada, para não sobrar aluno sem responsável.
- O status do aluno é "aguardando responsável" (menor de 12 sem autorização), "convidado" (ainda não entrou nenhuma vez) ou "ativo" (já entrou).
- O progresso do curso conta só as aulas publicadas marcadas como concluídas; o "Enviei a prova" fica registrado à parte e não muda a porcentagem. A porcentagem é arredondada para baixo, então 100% só aparece com todas as aulas concluídas.
- O botão "Continuar" leva à primeira aula ainda não concluída, na ordem dos módulos e das aulas. Com tudo concluído, vira "Rever o curso".
- O professor abre as telas do aluno ("Ver como aluno") para pré-visualizar os cursos publicados, sem os botões de concluir e sem rascunhos.
- Os avisos são publicados na hora em que são criados. Editar um aviso não muda a data dele, então ele não volta ao topo da lista.
- O aluno vê os avisos gerais e os dos cursos publicados em que está matriculado, do mais novo para o mais antigo; quem decide isso é o banco. Na pré-visualização, o professor vê todos.
- O painel do professor conta só as aulas publicadas, com a mesma regra da tela do aluno. As provas contadas são as das aulas publicadas.
- A última atividade do aluno é o registro de progresso mais recente (aula concluída ou prova enviada), não o último login.
- O detalhe do progresso de cada aluno fica em `/professor/progresso/...`, separado da ficha de cadastro e matrículas em `/professor/alunos/...`.
- O "autorizo" do responsável é recebido por uma rota (`/aceite/.../autorizar`), não por server action, porque quem envia não tem login: a proteção é o token. A gravação só acontece onde o aceite ainda está vazio, então o mesmo link não vale duas vezes.
- Depois do aceite, o servidor envia ao aluno um código de acesso (modelo `supabase/templates/codigo.html`). Se o código vencer, o aluno pede outro na tela de login. Depois de mudar o `config.toml`, é preciso reiniciar o Supabase local.
- A versão dos termos gravada no aceite fica em `src/lib/site.ts` (`VERSAO_DOS_TERMOS`). Mudou o texto da política ou dos termos, muda a versão.
- A política de privacidade e os termos de uso são rascunhos para revisão jurídica e avisam isso no topo.
- A exclusão de um aluno pede o nome digitado (sem contar maiúsculas e espaços nas pontas), conferido de novo no servidor. Ela apaga a conta de login, e o banco apaga em cascata perfil, responsável, matrículas e progresso.
- Nome, logo e cores ainda são provisórios. As cores ficam como variáveis do tema em `src/app/globals.css` (`primaria` e `secundaria`), o nome e o logo em `src/lib/site.ts`, e o logo em `public/logo.svg`. As cores de aviso (vermelho, verde, amarelo) não mudam com a identidade.
- Os limites do login ficam no `supabase/config.toml` e, na nuvem, são configurados à mão no painel do Supabase com os mesmos valores (`guias/deploy.md`). O Supabase só conta verificações de código em janelas de 5 minutos por endereço, não por hora.
- O professor envia no máximo 20 convites por hora, contando os reenvios. Quem garante é o banco (tabela `envios_convite`); a vaga é gasta antes do envio, mesmo que o e-mail falhe. Cadastrar um menor de 12 não conta, porque não envia e-mail.
- O reenvio de convite aparece só para quem ainda não entrou. O menor de 12 só recebe depois da autorização do responsável, e recebe um código de acesso em vez do convite.
- A auditoria registra quando o professor abre a ficha, matricula, desmatricula ou exclui um aluno menor de 18 anos (sem data de nascimento, registra por precaução). Quem decide a idade e grava é o banco, pela função `registrar_acesso`; a aplicação não grava direto na tabela.
- Ainda não existe tela para editar os dados do aluno; a ação "editar" já é aceita pela auditoria para quando ela existir.
- Se o registro falhar, a ação não acontece e a ficha não abre.
- A auditoria guarda só o id do aluno, sem nome nem e-mail, e não tem ligação com o perfil, para continuar valendo depois da exclusão. Um gatilho impede alterar ou apagar registros, mesmo com a chave de serviço.
- Atualizar a ficha depois de matricular conta como abrir de novo e gera outro registro de abertura.
- Os testes de ponta a ponta usam o Playwright só com o Chromium, nos perfis de computador e de celular (Pixel 7). Ficam fora do `npm run check` por serem lentos e vão rodar nas verificações automáticas da publicação.
- Antes dos testes de ponta a ponta o banco local é recriado (`npx supabase db reset`) e recebe os usuários de teste (`seed:dev`). Isso apaga tudo o que estava no banco local.
- No login dos testes, o código é lido pela API da caixa de e-mail local (Mailpit) e digitado na tela.
- Os testes rodam um por vez e cada perfil cria o próprio curso, porque todos dividem o mesmo banco e os limites de login por endereço.
- O bloqueio do aluno age em duas frentes. No banco, a coluna `bloqueado_em` faz a regra de acesso do aluno recusar tudo na mesma hora, mesmo com a sessão ainda aberta. No login, o Supabase passa a recusar a entrada e a renovação da sessão. Nada é apagado: ao desbloquear, o aluno volta a ver os cursos e o progresso.
- O bloqueio não tem prazo: vale até o professor desbloquear.
- Bloquear e desbloquear sempre ficam registrados na auditoria, em qualquer idade, porque são ações do professor e não acessos a dados. O banco só aceita mudar o bloqueio pela função que também grava o registro.
- O Supabase aceita o pedido de código de um aluno bloqueado e só recusa quando ele confirma o código. A mensagem de acesso pausado aparece nessa hora.
- Com a sessão aberta, o Supabase já recusa o aluno bloqueado na página seguinte. O site apaga a sessão e mostra o aviso na tela de login. A página `/bloqueado` cobre o caso em que o banco já bloqueou, mas o login ainda não.
- O status "bloqueado" vale acima dos outros, e o reenvio de convite fica indisponível enquanto o aluno estiver bloqueado.
- Quem entra pelo Google sem ter sido cadastrado vira um pedido pendente (`perfis.liberado_em` vazio). A regra de acesso do aluno exige a liberação, então o pendente não vê nada além do próprio nome, mesmo com a sessão aberta.
- O cadastro feito pelo professor leva a marca `origem: professor` no `app_metadata`, que só a chave de serviço grava, e já nasce liberado. Por isso o convite agora cria a conta primeiro e envia o convite em seguida. Quem se cadastra sozinho nasce sem data de nascimento: os metadados enviados pelo próprio usuário são ignorados, porque com o cadastro aberto qualquer um poderia forjá-los.
- O Google não informa a data de nascimento. Ao liberar, o professor informa a data, e o banco decide se o aluno tem menos de 12 anos; nesse caso o professor informa o responsável, vai para a ficha do aluno com o link de autorização, e o acesso só começa depois do aceite.
- Liberar e recusar sempre ficam na auditoria, em qualquer idade, como o bloqueio. O banco só aceita mudar a liberação pelas funções que também gravam o registro.
- Recusar apaga a conta, como a exclusão. Fica o registro da auditoria com o id e, por 7 dias, a recusa em `privado.recusas_recentes`: o hash do e-mail, uma dica mascarada (`a***@g***.com`) e o id. Nesse prazo, o hook "Before User Created" do Auth barra um novo cadastro desse e-mail, pelo código por e-mail ou pelo Google. Recusar de novo renova o prazo.
- O hash do e-mail é um HMAC-SHA256 com uma chave gerada na migração, guardada no schema `privado`, que não é exposto pela API. Um SHA-256 simples se descobriria testando listas de e-mails conhecidos. O e-mail é normalizado antes (minúsculas, sem espaços nas pontas).
- A dica mascarada mostra só a primeira letra do nome, a primeira letra do domínio e a última parte dele, para não revelar a instituição (`x***@e***.br` para `x@escola.sp.gov.br`). Ela é apagada junto com a recusa.
- O professor permite um novo pedido pela lista "Recusados recentemente" ou digitando o e-mail completo (o banco confere o hash). As duas formas vão para a auditoria (`permitir_pedido`), com o id da conta recusada. O cadastro feito pelo professor sempre apaga a recusa daquele e-mail; o hook do Supabase não roda na criação de conta pelo admin, então o convite nunca é barrado.
- O recusado que tenta de novo vê uma mensagem neutra ("Não foi possível pedir acesso agora. Fale com o professor."), para a tela não revelar a terceiros que aquele e-mail foi recusado.
- Depois de liberado, a revogação é o bloqueio que já existia; bloquear não desfaz a liberação, então desbloquear devolve o acesso.
- Revisto: o link mágico agora também cria a conta (`shouldCreateUser: true`), e quem não tem cadastro pede acesso pelo e-mail. A tela mostra a mesma mensagem ("Enviamos um link…") para quem tem conta e para quem não tem, para não revelar quais e-mails estão cadastrados.
- Digitar o e-mail cria a conta na hora, antes de qualquer clique. Por isso o pedido só conta depois que a pessoa clica no link ou volta do Google (`perfis.pedido_em`): sem a marca, a conta não aparece para o professor e não gera aviso. Assim ninguém enche a lista com e-mails de terceiros. A conta nunca confirmada dá lugar ao cadastro feito pelo professor.
- O pedido do link mágico passa pelo captcha do Cloudflare Turnstile, ligado no Auth do Supabase. O widget é carregado direto do script da Cloudflare, sem pacote novo. No computador e nos testes, as chaves de teste da Cloudflare aprovam sozinhas. O captcha não vale para o Google (o próprio Google se protege) nem para os envios do servidor com a chave de serviço, como o reenvio de convite.
- O primeiro link de quem ainda não tem conta usa o modelo de confirmação (`supabase/templates/confirmacao.html`), com o mesmo formato do link mágico.
- O aviso ao professor sai uma vez por pedido, no primeiro login, por SMTP (Resend na nuvem, Mailpit no computador). Se o envio falhar, o login segue, o pedido aparece no painel e o aviso é tentado de novo no próximo login. Sem as variáveis de SMTP, o aviso simplesmente não sai.
- Os testes de ponta a ponta fazem o pedido de verdade pelo e-mail, com um endereço novo a cada execução. O login do Google não dá para automatizar.
- O teste da recusa roda só no perfil de computador, para a execução não passar do limite de 15 logins a cada 5 minutos por endereço.
- Revisto: o link mágico foi trocado por um código de 6 dígitos no e-mail. A tela "Entrar" pede o e-mail (`signInWithOtp`) e passa para "Digite o código", com Confirmar (`verifyOtp`, tipo `email`), Reenviar código e Usar outro e-mail. A mensagem de envio é a mesma para quem tem e quem não tem conta. O código vale 10 minutos (`otp_expiry = 600`). Assim o login funciona em qualquer navegador ou aparelho, sem depender de abrir o link no mesmo navegador.
- Depois do código confirmado, a tela abre `/auth/concluir`, que faz o mesmo que a volta do Google (`src/app/auth/concluir-login.ts`): confirma o pedido de quem não tem cadastro, barra o bloqueado e leva cada papel à sua área. O pedido continua contando só depois do código confirmado. `/auth/callback` ficou só para o Google.
- O convite do professor não traz link nem código: explica que o aluno deve abrir a página de login e pedir o código. O convidado ainda não confirmado recebe o código pelo modelo de confirmação (`confirmacao.html`, mesmo texto de `codigo.html`).
- A sessão não fica salva, para alunos, professor e quem entra com o Google: os cookies do login são gravados sem `maxAge`/`expires` (cookies de sessão) nos três clientes do Supabase, e o proxy encerra a sessão (`signOut` com `scope: "local"`) depois de 2 horas sem uso, guardando a hora do último uso no cookie `ultimo-uso`. A regra fica no site porque o `inactivity_timeout` do Supabase só existe nos planos pagos. A versão dos termos passou a `4-rascunho` com a mudança na política de privacidade.
- Revisto: as cores aprovadas ficam no bloco `@theme` de `src/app/globals.css` (fundo creme, bordô, vinho e amarelo; `primaria` e `secundaria` não existem mais), as fontes são Bricolage Grotesque nos títulos e Manrope no texto, e as telas novas usam os componentes de `src/components/` (botão, campo, aviso, cordas e moldura); o tema escuro automático saiu e volta na sua própria etapa.
- O layout de celular vale até 767 px; a partir de 768 px a tela de entrada usa o layout do computador. Entre 768 e 1023 px, o título e a boca do violão ficam menores para não se sobreporem.
- No celular, a tela de entrada mantém o título "Entrar" e o botão "Receber código de acesso", porque o acesso é por código de 6 dígitos e os testes procuram o título "Entrar". O aviso de convite aparece em versão curta no rodapé, junto do link da política de privacidade.
- A área do aluno tem cabeçalho próprio (`src/components/cabecalho-do-aluno.tsx`), com Meus cursos, Avisos, o sino, o avatar com as iniciais e o Sair; a moldura do site some nessa tela, que traz o próprio link da política de privacidade. Perfil fica fora do menu até a tela existir.
- Ainda não há registro de avisos lidos, então o sino aparece sem a bolinha amarela; a contagem de não lidos chega numa etapa com migração própria. Avisos, o sino e "Ver todos os recados" levam à lista completa de recados no fim de Meus cursos (`#recados`).
- O "Continue de onde parou" usa o curso da aula com o registro de progresso mais recente; sem progresso, o primeiro curso (em ordem alfabética) que tem aulas. Com tudo concluído, o cartão diz isso e leva ao curso.
- A saudação (Bom dia até 11h59, Boa tarde até 17h59, Boa noite a partir das 18h e até 4h59) segue o horário de Brasília.
- Os cartões de curso inteiros são o link para a página do curso; o botão Começar fica na página do curso. O título da tela passou a ser só o nome do aluno, e os testes de ponta a ponta acompanham essas duas mudanças.
- A tela da aula tem cabeçalho próprio: o botão voltar ("Voltar para {curso}"), o logo e a trilha Curso / Módulo / Aula. O primeiro vídeo do YouTube abre a aula, os blocos de texto formam a descrição e os demais blocos viram os cartões de "Materiais da aula", na ordem do professor. O playback por link direto ganhou um botão grande de tocar; o do Drive continua no visualizador do Drive.
- A lateral mostra o progresso no curso e as aulas do módulo atual. Para isso, a página lê também as aulas concluídas no curso, o título dos módulos e o tipo dos blocos de cada aula (para marcar as aulas com prova). São só leituras, sob as mesmas regras de acesso: o aluno pendente, bloqueado ou sem aceite do responsável não vê nada.
- Concluída, o botão passa a "✓ Aula concluída" e continua desmarcando com um toque. O teste de ponta a ponta volta ao curso pelo botão "Voltar para {curso}".
- No celular, a aula mostra no topo o botão voltar, "Módulo N · Aula N" (a numeração da aula é a do curso, a mesma da lista lateral) e o nome do curso; o logo e a trilha ficam só no computador. O botão "Marcar como concluída" fica fixo no rodapé, sem a barra de abas, e as aulas do módulo vêm depois dos materiais numa lista recolhível, fechada por padrão. O ícone dos materiais tem 44 px no celular.
