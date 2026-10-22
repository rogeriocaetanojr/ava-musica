# Andamento

## Pendente

### Protótipo

- [ ] Login dos alunos e do professor por convite
- [ ] Telas do professor para criar cursos, módulos e aulas
- [ ] Conteúdo das aulas: texto, vídeos do YouTube, arquivos do Drive, áudio, links e provas do Google Forms
- [ ] Cadastro de alunos, matrícula nos cursos e regra para menores de 12 anos
- [ ] Área do aluno, com os cursos dele, as aulas e o progresso
- [ ] Avisos do professor e painel com o progresso de cada aluno
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

## Concluído

### Preparação

- [x] Ferramentas de desenvolvimento instaladas
- [x] Pasta do projeto, controle de versões e documentos iniciais
- [x] Regras do projeto escritas

### Protótipo

- [x] Base do site, com verificação de código, testes e configuração da hospedagem
- [x] Banco de dados com as regras de quem pode ver o quê e verificações automáticas a cada envio de código

## Decisões

- O arquivo que protege as páginas que exigem login (`src/proxy.ts`) só será criado junto com o login, porque vazio ele impede o site de ser gerado.
- Os tipos do Node estão na versão 24, a mesma usada no computador e nas verificações automáticas; a versão 20 é incompatível com a ferramenta de testes.
- O layout principal do site declara os tipos de forma explícita, para a checagem de tipos funcionar sem depender de arquivos gerados pelo Next.js.
- Depois de instalar ou remover um pacote, apague `node_modules` e `package-lock.json` e rode `npm install`, porque um defeito do npm às vezes apaga um arquivo de que os testes precisam.
- O aluno menor de 12 anos ainda sem autorização do responsável vê só o próprio nome, para a tela de espera saber quem ele é; todo o resto fica bloqueado.
- Os testes do banco vão além do mínimo pedido (por exemplo, visitante sem login não vê nada e o aluno não registra progresso em nome de outro), porque cobrem brechas reais.
- Os testes do banco rodam por um script em Node, sem exigir o `psql` instalado, e funcionam tanto no banco local quanto nas verificações automáticas.
