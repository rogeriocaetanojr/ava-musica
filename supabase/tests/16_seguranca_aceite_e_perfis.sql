-- S1: o aceite do responsável só pelo hash do código e dentro do prazo.
-- S3: idade, faixa de menor e papel não mudam pela API, nem com a chave de serviço.
-- S8: um perfil por e-mail, sem diferença de maiúsculas.

-- ---------------------------------------------------------------------------
-- S1
-- ---------------------------------------------------------------------------

do $$
begin
  assert not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'responsaveis' and column_name = 'token'
  ), 'a coluna token, com o código em texto puro, não deveria existir mais';
end;
$$;

-- Hash fora do formato SHA-256 em hexadecimal é recusado.
do $$
begin
  update public.responsaveis set token_hash = 'codigo-em-texto-puro'
  where aluno_id = '00000000-0000-0000-0000-0000000000b1';
  raise exception 'o banco não deveria aceitar o código em texto puro';
exception
  when check_violation then null;
end;
$$;

-- Link vencido: a gravação do servidor não acha nada e o menor segue sem acesso.
update public.responsaveis
set token_hash = encode(sha256('codigo-vencido'::bytea), 'hex'),
    expira_em = now() - interval '1 minute'
where aluno_id = '00000000-0000-0000-0000-0000000000b1';

do $$
declare
  gravados integer;
begin
  update public.responsaveis set aceito_em = now(), versao_termos = 'teste'
  where token_hash = encode(sha256('codigo-vencido'::bytea), 'hex')
    and aceito_em is null and expira_em > now();
  get diagnostics gravados = row_count;
  assert gravados = 0, 'o link vencido não deveria gravar o aceite';
end;
$$;

-- Sem link gerado (o caso dos tokens antigos, invalidados pela migração).
update public.responsaveis set token_hash = null, expira_em = null
where aluno_id = '00000000-0000-0000-0000-0000000000b1';

do $$
declare
  gravados integer;
begin
  update public.responsaveis set aceito_em = now(), versao_termos = 'teste'
  where token_hash = encode(sha256('qualquer'::bytea), 'hex')
    and aceito_em is null and expira_em > now();
  get diagnostics gravados = row_count;
  assert gravados = 0, 'sem link gerado, nenhum código deveria gravar o aceite';
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);

do $$
begin
  assert not public.aluno_liberado(), 'o menor continua sem acesso sem aceite válido';
end;
$$;

-- O aluno não lê o hash nem o prazo do próprio responsável.
do $$
begin
  assert (select count(*) from public.responsaveis) = 0,
    'o aluno não deveria ler a tabela de responsáveis';
end;
$$;

-- ---------------------------------------------------------------------------
-- S3 pelo professor (API, com a sessão dele)
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

-- Pôr menor_de_12 = false pularia o aceite do responsável.
do $$
begin
  update public.perfis set menor_de_12 = false
  where id = '00000000-0000-0000-0000-0000000000b1';
  raise exception 'o professor não deveria mudar menor_de_12 pela API';
exception
  when insufficient_privilege then
    assert sqlerrm like '%só muda%', 'barrado por outro motivo: ' || sqlerrm;
end;
$$;

do $$
begin
  update public.perfis set data_nascimento = '2000-01-01'
  where id = '00000000-0000-0000-0000-0000000000b1';
  raise exception 'o professor não deveria mudar a data de nascimento pela API';
exception
  when insufficient_privilege then
    assert sqlerrm like '%só muda%', 'barrado por outro motivo: ' || sqlerrm;
end;
$$;

do $$
begin
  update public.perfis set papel = 'professor'
  where id = '00000000-0000-0000-0000-0000000000a1';
  raise exception 'o professor não deveria promover um aluno pela API';
exception
  when insufficient_privilege then
    assert sqlerrm like '%só muda%', 'barrado por outro motivo: ' || sqlerrm;
end;
$$;

-- Apagar o perfil e criar de novo como professor também é barrado.
do $$
begin
  delete from public.perfis where id = '00000000-0000-0000-0000-0000000000a1';
  insert into public.perfis (id, nome, email, papel)
  values ('00000000-0000-0000-0000-0000000000a1', 'Aluno', 'aluno@testes-banco.local', 'professor');
  raise exception 'o professor não deveria recriar um perfil como professor';
exception
  when insufficient_privilege then
    assert sqlerrm like '%só muda%', 'barrado por outro motivo: ' || sqlerrm;
end;
$$;

-- As outras colunas continuam editáveis pelo professor.
do $$
declare
  alterados integer;
begin
  update public.perfis set pedido_avisado_em = now()
  where id = '00000000-0000-0000-0000-0000000000a1';
  get diagnostics alterados = row_count;
  assert alterados = 1, 'o professor deveria continuar editando colunas comuns';
end;
$$;

do $$
begin
  assert (select menor_de_12 from public.perfis where id = '00000000-0000-0000-0000-0000000000b1'),
    'menor_de_12 do menor não deveria ter mudado';
  assert (select papel from public.perfis where id = '00000000-0000-0000-0000-0000000000a1') = 'aluno',
    'o aluno deveria continuar aluno';
end;
$$;

-- liberar_aluno, que grava a auditoria, continua mudando a data de nascimento.
reset role;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000d1', 'pedido@testes-banco.local', '{"nome": "Pedido"}');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select public.liberar_aluno('00000000-0000-0000-0000-0000000000d1', '2018-06-01');

do $$
begin
  assert (select data_nascimento from public.perfis where id = '00000000-0000-0000-0000-0000000000d1') = '2018-06-01',
    'liberar_aluno deveria gravar a data de nascimento';
  assert (select menor_de_12 from public.perfis where id = '00000000-0000-0000-0000-0000000000d1'),
    'liberar_aluno deveria marcar o menor de 12';
  assert exists (
    select 1 from public.auditoria
    where aluno_id = '00000000-0000-0000-0000-0000000000d1' and acao = 'liberar'
  ), 'a liberação deveria estar na auditoria';
end;
$$;

-- ---------------------------------------------------------------------------
-- S3 pela chave de serviço
-- ---------------------------------------------------------------------------

reset role;
set local role service_role;

do $$
begin
  update public.perfis set menor_de_12 = false
  where id = '00000000-0000-0000-0000-0000000000b1';
  raise exception 'a chave de serviço não deveria mudar menor_de_12';
exception
  when insufficient_privilege then
    assert sqlerrm like '%só muda%', 'barrado por outro motivo: ' || sqlerrm;
end;
$$;

-- ---------------------------------------------------------------------------
-- S8
-- ---------------------------------------------------------------------------

reset role;

do $$
begin
  insert into auth.users (id, email) values
    ('00000000-0000-0000-0000-0000000000e1', 'ALUNO@Testes-Banco.local');
  raise exception 'um segundo perfil com o mesmo e-mail em outra caixa não deveria ser criado';
exception
  when unique_violation then null;
end;
$$;
