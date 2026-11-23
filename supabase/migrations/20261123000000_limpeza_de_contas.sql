-- D3: apaga as contas de Criar conta nunca confirmadas (ninguém abriu o link
-- de confirmação) depois de 48 horas. Elas não aparecem para o professor nem
-- dão acesso a nada; ficam só ocupando o e-mail e guardando um dado pessoal
-- sem motivo (LGPD).
--
-- Fica de fora quem foi cadastrado pelo professor (app_metadata.origem), que
-- já nasce confirmado, e quem entrou pelo Google (confirmado pelo Google).
-- Apagar em auth.users leva junto, em cascata, o perfil e o que for dele.

create function privado.apagar_contas_nao_confirmadas()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  apagadas integer;
begin
  delete from auth.users u
  where u.email_confirmed_at is null
    and u.created_at < now() - interval '48 hours'
    and coalesce(u.raw_app_meta_data ->> 'origem', '') <> 'professor';
  get diagnostics apagadas = row_count;
  return apagadas;
end;
$$;

revoke all on function privado.apagar_contas_nao_confirmadas() from public, anon, authenticated;

-- Agenda a limpeza para todo dia às 3h (horário de Brasília, 6h UTC) onde o
-- pg_cron existe (Supabase local e nuvem). No Postgres puro dos testes do CI
-- ele não existe, e a função continua testável sem o agendamento.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule(
      'apagar-contas-nao-confirmadas',
      '0 6 * * *',
      'select privado.apagar_contas_nao_confirmadas()'
    );
  end if;
end;
$$;
