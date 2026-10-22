# Andamento

## Pendente

### Protótipo

- [ ] Autorização do responsável, política de privacidade, exclusão de dados e identidade visual
- [ ] Limite de tentativas de login e registro de acessos
- [ ] Testes automáticos que usam o site como um aluno e um professor usariam

### Revisão

- [ ] Revisão do protótipo e demonstração para o professor

### Publicação do site

- [ ] Contas dos serviços criadas e com acesso de duas pessoas
- [ ] Banco de dados na nuvem, com ambientes de teste e de uso real
- [ ] Chaves e configurações secretas guardadas com segurança
- [ ] Site publicado na Netlify, com versão de teste e versão oficial
- [ ] Login com Google e envio de e-mails funcionando de verdade
- [ ] Verificações automáticas completas a cada mudança no código
- [ ] Publicação automática da versão de teste e promoção para a oficial
- [ ] Endereço próprio do site e proteções de segurança do navegador
- [ ] Cópias de segurança do banco de dados
- [ ] Alertas quando o site cair ou apresentar erros
- [ ] Cuidados com os dados pessoais no dia a dia, conforme a LGPD
- [ ] Manual do professor e documentação do projeto
- [ ] Lançamento com um primeiro grupo de alunos

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
- [x] Login dos alunos e do professor por convite, com Google ou link por e-mail
- [x] Telas do professor para criar, editar, publicar e reordenar cursos, módulos e aulas
- [x] Conteúdo das aulas: texto, vídeos do YouTube, arquivos do Drive, áudio, links e provas do Google Forms, com pré-visualização
- [x] Cadastro de alunos por convite, matrícula nos cursos e regra para menores de 12 anos
- [x] Área do aluno, com os cursos dele, as aulas, a conclusão de aulas, o envio de provas e o progresso
- [x] Avisos do professor e painel com o progresso de cada aluno

## Decisões

- O arquivo que protege as páginas que exigem login (`src/proxy.ts`) só será criado junto com o login, porque vazio ele impede o site de ser gerado.
- Os tipos do Node estão na versão 24, a mesma usada no computador e nas verificações automáticas; a versão 20 é incompatível com a ferramenta de testes.
- O layout principal do site declara os tipos de forma explícita, para a checagem de tipos funcionar sem depender de arquivos gerados pelo Next.js.
- Depois de instalar ou remover um pacote, apague `node_modules` e `package-lock.json` e rode `npm install`, porque um defeito do npm às vezes apaga um arquivo de que os testes precisam.
- O aluno menor de 12 anos ainda sem autorização do responsável vê só o próprio nome, para a tela de espera saber quem ele é; todo o resto fica bloqueado.
- Os testes do banco vão além do mínimo pedido (por exemplo, visitante sem login não vê nada e o aluno não registra progresso em nome de outro), porque cobrem brechas reais.
- Os testes do banco rodam por um script em Node, sem exigir o `psql` instalado, e funcionam tanto no banco local quanto nas verificações automáticas.
- O cadastro aberto fica desligado na configuração geral do login (`[auth] enable_signup = false`). O cadastro por e-mail continua ligado porque, no Supabase local, desligá-lo desativa também o link mágico; quem não foi convidado é recusado do mesmo jeito.
- O login com Google fica desligado no Supabase local até existirem chaves do Google; lá o teste é feito pelo link mágico.
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
- A página de autorização do responsável (`/aceite/...`) é da etapa 9. Até lá o link copiado pelo professor abre uma página de "não encontrado".
- O progresso do curso conta só as aulas publicadas marcadas como concluídas; o "Enviei a prova" fica registrado à parte e não muda a porcentagem. A porcentagem é arredondada para baixo, então 100% só aparece com todas as aulas concluídas.
- O botão "Continuar" leva à primeira aula ainda não concluída, na ordem dos módulos e das aulas. Com tudo concluído, vira "Rever o curso".
- O professor abre as telas do aluno ("Ver como aluno") para pré-visualizar os cursos publicados, sem os botões de concluir e sem rascunhos.
- Os avisos são publicados na hora em que são criados. Editar um aviso não muda a data dele, então ele não volta ao topo da lista.
- O aluno vê os avisos gerais e os dos cursos publicados em que está matriculado, do mais novo para o mais antigo; quem decide isso é o banco. Na pré-visualização, o professor vê todos.
- O painel do professor conta só as aulas publicadas, com a mesma regra da tela do aluno. As provas contadas são as das aulas publicadas.
- A última atividade do aluno é o registro de progresso mais recente (aula concluída ou prova enviada), não o último login.
- O detalhe do progresso de cada aluno fica em `/professor/progresso/...`, separado da ficha de cadastro e matrículas em `/professor/alunos/...`.
