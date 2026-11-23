#!/usr/bin/env bash
# Restaura um backup feito por fazer-backup.sh num banco que já tem as
# migrações aplicadas e está vazio (por exemplo, depois de
# `npx supabase db reset` ou de `supabase db push` num projeto novo).
# Uso: SUPABASE_DB_URL=... BACKUP_SENHA=... scripts/backup/restaurar-backup.sh <arquivo .sql.gz.enc>
# Passo a passo e cuidados: guias/backup.md.
set -euo pipefail

arquivo="${1:?informe o arquivo do backup}"
: "${SUPABASE_DB_URL:?defina SUPABASE_DB_URL}"
: "${BACKUP_SENHA:?defina BACKUP_SENHA}"

sql="$(mktemp)"
trap 'rm -f "$sql"' EXIT
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass env:BACKUP_SENHA \
  -in "$arquivo" | gunzip > "$sql"

# Tudo numa transação: se algo falhar, o banco fica como estava.
# - session_replication_role = replica desliga os gatilhos durante a carga
#   (o perfil já vem no backup; o gatilho do Auth criaria outro, e os gatilhos
#   de proteção recusariam gravar idade, papel e liberação direto).
# - A chave das recusas criada pela migração dá lugar à do backup, para os
#   hashes das recusas continuarem valendo.
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 --single-transaction -q \
  -c "set session_replication_role = replica" \
  -c "delete from privado.chave_recusas" \
  -f "$sql" \
  -c "set session_replication_role = origin"

echo "Backup restaurado."
