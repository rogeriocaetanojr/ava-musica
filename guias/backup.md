# Backup e restauração do banco

O plano gratuito do Supabase não tem recuperação a um ponto no tempo. O backup é feito pelo GitHub Actions toda semana.

## Como o backup é feito

- **Quando:** domingo às 3h (horário de Brasília), pelo workflow `.github/workflows/backup.yml`. Dá para rodar na hora em **Actions → Backup do banco → Run workflow**.
- **O quê:** só os dados (o esquema vem das migrações), dos schemas `public` (cursos, alunos, progresso, auditoria…), `privado` (recusas e a chave delas) e `auth` (as contas e as senhas cifradas). Ficam de fora as sessões, os tokens e o log do Auth, que guardam IP e aparelho e não fazem falta para o site voltar.
- **Não entra:** os arquivos do Supabase Storage (áudios das aulas). Guarde as cópias originais deles.
- **Onde fica:** nos artefatos da execução do workflow, por 90 dias, num arquivo `backup-<data>.sql.gz.enc`, cifrado (AES-256) com a senha do segredo `BACKUP_SENHA`, e no `versao-do-esquema.txt`, com a última migração aplicada.
- **Segredos** (environment `producao-leitura`): `SUPABASE_DB_URL` (endereço de conexão do banco de produção, com a senha) e `BACKUP_SENHA`. **Guarde a `BACKUP_SENHA` também fora do GitHub** (gerenciador de senhas do professor): sem ela, o backup não abre.

Há dados de menores no backup. Só baixe o arquivo para restaurar, e apague a cópia baixada depois.

## Restaurar

Precisa de: Git Bash ou Linux com `openssl`, `gzip` e o cliente do Postgres 17 (`psql`), o arquivo do backup e a `BACKUP_SENHA`.

1. **Baixe o backup:** em **Actions → Backup do banco**, abra a execução da data desejada e baixe o artefato `backup-…`. Descompacte o `.zip`.
2. **Prepare um banco vazio com o esquema da mesma versão** (veja o `versao-do-esquema.txt`):
   - **No computador, para conferir o backup:** `npx supabase db reset` (recria o banco local com todas as migrações; apaga o que houver nele).
   - **Na nuvem, depois de perder o banco:** crie um projeto novo no Supabase, aplique as migrações com `npx supabase db push --db-url "<endereço do projeto novo>"` e refaça as configurações do painel (`guias/deploy.md`). Se o repositório já tiver migrações mais novas que a do backup, faça o checkout do commit da versão do backup antes do `db push` e aplique as novas depois da restauração.
3. **Restaure** (troque os valores entre `<>`):

   ```bash
   export SUPABASE_DB_URL="<endereço do banco de destino>"
   export BACKUP_SENHA="<senha do backup>"
   bash scripts/backup/restaurar-backup.sh backup-<data>.sql.gz.enc
   ```

   No Supabase local, o endereço é `postgresql://postgres:postgres@127.0.0.1:54322/postgres`. Tudo roda numa transação: se der erro, o banco fica como estava. Com a senha errada, para em "not in gzip format".

4. **Confira:** entre no site com o professor e com um aluno, e veja os cursos, os alunos e o progresso.
5. **Na nuvem:** aponte a Netlify para o projeto novo (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`) e publique de novo. Os alunos entram de novo com a mesma senha; as sessões antigas não voltam.

## Teste de restauração

Faça uma vez por semestre, com o backup mais recente, no banco local (passos 1 a 4, com `npx supabase db reset`). O teste feito na criação deste guia, com o banco local de desenvolvimento, voltou todas as tabelas do backup com as mesmas contagens, a mesma chave das recusas e o login do professor funcionando.
