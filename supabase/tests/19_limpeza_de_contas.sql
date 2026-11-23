-- D3: a limpeza apaga só as contas de Criar conta não confirmadas há mais de
-- 48 horas; as confirmadas, as recentes e as cadastradas pelo professor ficam.

insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data, email_confirmed_at, created_at) values
  -- Criar conta sem confirmar, há 3 dias: sai.
  ('00000000-0000-0000-0000-0000000000e1', 'velha@testes-banco.local', '{}', '{"nome": "Velha"}', null, now() - interval '3 days'),
  -- Criar conta sem confirmar, há 47 horas: fica (ainda dentro do prazo).
  ('00000000-0000-0000-0000-0000000000e2', 'recente@testes-banco.local', '{}', '{"nome": "Recente"}', null, now() - interval '47 hours'),
  -- Confirmada, há 3 dias: fica.
  ('00000000-0000-0000-0000-0000000000e3', 'confirmada@testes-banco.local', '{}', '{"nome": "Confirmada"}', now() - interval '3 days', now() - interval '3 days'),
  -- Cadastrada pelo professor, sem confirmação gravada, há 3 dias: fica.
  ('00000000-0000-0000-0000-0000000000e4', 'professor-cadastrou@testes-banco.local', '{"origem": "professor"}', '{"nome": "Cadastrada"}', null, now() - interval '3 days');

-- Só quem tem acesso direto ao banco (o agendamento) chama a função.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

do $$
begin
  perform privado.apagar_contas_nao_confirmadas();
  raise exception 'o professor não deveria chamar a limpeza pela API';
exception
  when insufficient_privilege then null;
end;
$$;

reset role;

do $$
declare
  apagadas integer;
begin
  apagadas := privado.apagar_contas_nao_confirmadas();
  assert apagadas = 1, format('deveria apagar 1 conta, apagou %s', apagadas);
  assert not exists (select 1 from auth.users where id = '00000000-0000-0000-0000-0000000000e1'),
    'a conta velha não confirmada deveria ter saído';
  assert not exists (select 1 from public.perfis where id = '00000000-0000-0000-0000-0000000000e1'),
    'o perfil da conta apagada deveria ter saído junto';
  assert (select count(*) from auth.users where id in (
    '00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000e3',
    '00000000-0000-0000-0000-0000000000e4')) = 3,
    'as contas recentes, confirmadas e do professor deveriam ficar';
  -- As contas do _dados.sql (sem confirmação gravada, mas do professor) ficam.
  assert exists (select 1 from auth.users where id = '00000000-0000-0000-0000-0000000000a1');
end;
$$;
