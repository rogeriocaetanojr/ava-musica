#!/usr/bin/env bash
# Faz o backup dos dados do banco: um arquivo SQL só com os dados (o esquema
# vem das migrações), comprimido e cifrado com a senha de BACKUP_SENHA.
# Uso: SUPABASE_DB_URL=... BACKUP_SENHA=... scripts/backup/fazer-backup.sh <pasta>
# Restauração: guias/backup.md.
set -euo pipefail

pasta="${1:?informe a pasta de saída}"
: "${SUPABASE_DB_URL:?defina SUPABASE_DB_URL}"
: "${BACKUP_SENHA:?defina BACKUP_SENHA}"
mkdir -p "$pasta"
data="$(date -u +%Y-%m-%dT%H%M%SZ)"
arquivo="$pasta/backup-$data.sql.gz.enc"

# Versão do esquema: a última migração aplicada. A restauração precisa de um
# banco com as migrações até essa versão.
versao="$(psql "$SUPABASE_DB_URL" -At -c \
  "select max(version) from supabase_migrations.schema_migrations")"
echo "$versao" > "$pasta/versao-do-esquema.txt"

# Dados do site (public), das recusas e da chave delas (privado) e das contas
# (auth). Ficam de fora os registros do Auth que não fazem falta para voltar
# o site e guardam IP e aparelho (sessões, tokens, log de auditoria do Auth),
# e as tabelas que o próprio Supabase recria.
pg_dump "$SUPABASE_DB_URL" \
  --data-only --no-owner --no-privileges \
  --schema=public --schema=privado --schema=auth \
  --exclude-table=auth.schema_migrations \
  --exclude-table=auth.audit_log_entries \
  --exclude-table=auth.sessions \
  --exclude-table=auth.refresh_tokens \
  --exclude-table=auth.one_time_tokens \
  --exclude-table=auth.flow_state \
  --exclude-table=auth.mfa_challenges \
  --exclude-table=auth.mfa_amr_claims \
  --exclude-table=auth.instances \
  | gzip -9 \
  | openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -pass env:BACKUP_SENHA \
  > "$arquivo"

echo "Backup gravado em $arquivo (esquema na migração $versao)."
