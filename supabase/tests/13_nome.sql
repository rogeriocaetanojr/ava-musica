-- Nome: sem nome nos metadados o perfil nasce sem nome (nunca com o e-mail),
-- a pessoa informa o nome uma vez só e o professor muda o nome pela função,
-- com auditoria.

insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000e1', 'semnome@testes-banco.local', '{}', '{}'),
  ('00000000-0000-0000-0000-0000000000e2', 'google@testes-banco.local', '{}',
   '{"full_name": "  Bruna Lima  "}');

do $$
begin
  assert (select nome is null from public.perfis
          where id = '00000000-0000-0000-0000-0000000000e1'),
    'sem nome nos metadados, o nome deveria ficar nulo, não o e-mail';
  assert (select nome = 'Bruna Lima' from public.perfis
          where id = '00000000-0000-0000-0000-0000000000e2'),
    'o nome do Google deveria ser aproveitado sem os espaços das pontas';
end;
$$;

set local role authenticated;

-- A pessoa sem nome informa o nome.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e1', true);

do $$
begin
  perform public.definir_meu_nome('   ');
  raise exception 'nome em branco não deveria ser aceito';
exception
  when invalid_parameter_value then null;
end;
$$;

select public.definir_meu_nome('  Carla Dias ');

do $$
begin
  assert (select nome = 'Carla Dias' from public.perfis
          where id = '00000000-0000-0000-0000-0000000000e1'),
    'o nome informado deveria ser gravado';
end;
$$;

-- Depois de informado, a pessoa não troca o nome sozinha.
do $$
begin
  perform public.definir_meu_nome('Outro Nome');
  raise exception 'a pessoa não deveria trocar o nome já informado';
exception
  when no_data_found then null;
end;
$$;

-- O aluno não muda o próprio nome pela função do professor.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

do $$
begin
  perform public.definir_nome_do_aluno('00000000-0000-0000-0000-0000000000a1', 'Outro');
  raise exception 'o aluno não deveria usar a função do professor';
exception
  when insufficient_privilege then null;
end;
$$;

-- O professor muda o nome pela função, e fica na auditoria.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select public.definir_nome_do_aluno('00000000-0000-0000-0000-0000000000a1', 'Aluno Renomeado');

do $$
begin
  assert (select nome = 'Aluno Renomeado' from public.perfis
          where id = '00000000-0000-0000-0000-0000000000a1'),
    'o professor deveria mudar o nome';
  assert (select count(*) from public.auditoria
          where aluno_id = '00000000-0000-0000-0000-0000000000a1' and acao = 'renomear') = 1,
    'a mudança de nome deveria ir para a auditoria';
end;
$$;

-- Nem o professor muda a coluna direto, sem passar pela auditoria.
do $$
begin
  update public.perfis set nome = 'Direto'
  where id = '00000000-0000-0000-0000-0000000000a1';
  raise exception 'o professor não deveria mudar o nome sem a função';
exception
  when insufficient_privilege then null;
end;
$$;
