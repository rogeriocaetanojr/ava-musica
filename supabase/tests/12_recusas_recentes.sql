-- Recusas recentes: a recusa guarda só o hash (com chave) e a dica do e-mail
-- por 7 dias, o hook do Auth barra um novo cadastro desse e-mail nesse prazo,
-- só o professor vê a lista e permite um novo pedido (com auditoria) e
-- ninguém lê a tabela direto.

-- r1 e r2 pediram acesso; r1 vai ser recusado e r2 liberado.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000f1', 'Recusado.Um@Gmail.com', '{"full_name": "Recusado Um"}'),
  ('00000000-0000-0000-0000-0000000000f2', 'outro@testes-banco.local', '{"full_name": "Outro"}');

do $$
begin
  assert (select pedido_em is null from public.perfis
          where id = '00000000-0000-0000-0000-0000000000f1'),
    'a conta nova só vira pedido depois da confirmação (pedido_em)';
end;
$$;

set local role authenticated;

-- O aluno não vê nem permite recusas.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

do $$
begin
  perform public.listar_recusas_recentes();
  raise exception 'o aluno não deveria ver as recusas';
exception
  when insufficient_privilege then null;
end;
$$;

do $$
begin
  perform public.permitir_novo_pedido_por_email('recusado.um@gmail.com');
  raise exception 'o aluno não deveria permitir novos pedidos';
exception
  when insufficient_privilege then null;
end;
$$;

-- O professor recusa r1.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select public.registrar_recusa('00000000-0000-0000-0000-0000000000f1');

do $$
begin
  assert (select count(*) from public.listar_recusas_recentes()) = 1,
    'a recusa deveria aparecer na lista do professor';
  assert (select dica = 'r***@g***.com' and aluno_id = '00000000-0000-0000-0000-0000000000f1'
                 and vale_ate = recusado_em + interval '7 days'
          from public.listar_recusas_recentes()),
    'a lista deveria mostrar a dica mascarada e o prazo de 7 dias';
end;
$$;

-- Ninguém lê a tabela nem a chave direto.
do $$
begin
  perform 1 from privado.recusas_recentes;
  raise exception 'o professor não deveria ler a tabela de recusas direto';
exception
  when insufficient_privilege then null;
end;
$$;

do $$
begin
  perform 1 from privado.chave_recusas;
  raise exception 'ninguém deveria ler a chave do hash';
exception
  when insufficient_privilege then null;
end;
$$;

do $$
begin
  perform public.antes_de_criar_usuario('{"user": {"email": "x@y.com"}}');
  raise exception 'só o Auth deveria chamar o hook';
exception
  when insufficient_privilege then null;
end;
$$;

reset role;

-- A conta é apagada pela aplicação depois da recusa.
delete from auth.users where id = '00000000-0000-0000-0000-0000000000f1';

do $$
declare
  barrado jsonb := '{"error": {"http_code": 403, "message": "Não foi possível pedir acesso agora."}}';
begin
  assert (select email_hash <> encode(extensions.digest('recusado.um@gmail.com', 'sha256'), 'hex')
          from privado.recusas_recentes),
    'o hash não deveria ser o SHA-256 simples do e-mail';
  assert (select count(*) from privado.recusas_recentes where dica like '%recusado%') = 0,
    'nada guardado deveria trazer o e-mail completo';

  -- O hook barra o mesmo e-mail, com outras maiúsculas e espaços.
  assert public.antes_de_criar_usuario('{"user": {"email": " RECUSADO.um@gmail.com "}}') = barrado,
    'o hook deveria barrar o e-mail recusado há menos de 7 dias';
  -- E deixa passar outro e-mail.
  assert public.antes_de_criar_usuario('{"user": {"email": "novo@gmail.com"}}') = '{}'::jsonb,
    'o hook não deveria barrar outro e-mail';
end;
$$;

-- Passados 7 dias, a recusa vence: o hook deixa passar e apaga o registro.
update privado.recusas_recentes set recusado_em = now() - interval '7 days 1 minute';

do $$
begin
  assert public.antes_de_criar_usuario('{"user": {"email": "recusado.um@gmail.com"}}') = '{}'::jsonb,
    'o hook deveria deixar passar depois de 7 dias';
  assert (select count(*) from privado.recusas_recentes) = 0,
    'a recusa vencida deveria ser apagada';
end;
$$;

-- Recusa de novo (outra conta, mesmo e-mail) para testar a permissão.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000f3', 'recusado.um@gmail.com');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select public.registrar_recusa('00000000-0000-0000-0000-0000000000f3');

-- Pela lista: some da lista, fica na auditoria; repetir avisa que não há.
select public.permitir_novo_pedido('00000000-0000-0000-0000-0000000000f3');

do $$
begin
  assert (select count(*) from public.listar_recusas_recentes()) = 0,
    'a recusa permitida deveria sair da lista';
  assert (select count(*) from public.auditoria
          where aluno_id = '00000000-0000-0000-0000-0000000000f3' and acao = 'permitir_pedido') = 1,
    'a permissão deveria ir para a auditoria';
  perform public.permitir_novo_pedido('00000000-0000-0000-0000-0000000000f3');
  raise exception 'permitir de novo deveria falhar';
exception
  when no_data_found then null;
end;
$$;

-- Pelo e-mail digitado (e pelo cadastro do professor, que usa a mesma função).
select public.registrar_recusa('00000000-0000-0000-0000-0000000000f2');

do $$
begin
  assert not public.permitir_novo_pedido_por_email('ninguem@gmail.com'),
    'e-mail sem recusa deveria devolver false';
  assert public.permitir_novo_pedido_por_email('  OUTRO@testes-banco.local'),
    'o e-mail digitado com outras maiúsculas deveria achar a recusa';
  assert (select count(*) from public.auditoria
          where aluno_id = '00000000-0000-0000-0000-0000000000f2' and acao = 'permitir_pedido') = 1,
    'a permissão pelo e-mail deveria ir para a auditoria';
  assert (select count(*) from public.listar_recusas_recentes()) = 0,
    'a recusa permitida pelo e-mail deveria sair da lista';
end;
$$;

reset role;

do $$
begin
  assert public.antes_de_criar_usuario('{"user": {"email": "outro@testes-banco.local"}}') = '{}'::jsonb,
    'depois de permitido, o hook deveria deixar passar';
end;
$$;
