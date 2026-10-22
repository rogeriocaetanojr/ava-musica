-- Aluno não consegue se promover a professor, nem pelos metadados nem por update.

-- O gatilho ignora um papel enviado nos metadados do convite.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000c1', 'esperto@testes-banco.local',
   '{"nome": "Esperto", "papel": "professor"}');

do $$
begin
  assert (select papel from public.perfis where id = '00000000-0000-0000-0000-0000000000c1')
    = 'aluno', 'o gatilho deveria criar o perfil sempre como aluno';
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

-- Sem política de update, a alteração não atinge nenhuma linha.
update public.perfis set papel = 'professor' where id = auth.uid();

do $$
begin
  assert (select count(*) from public.perfis) = 1, 'aluno deveria ver só o próprio perfil';
  assert not public.eh_professor(), 'aluno não deveria virar professor';
end;
$$;

-- Aluno também não cria cursos.
do $$
begin
  insert into public.cursos (titulo, instrumento) values ('Invasão', 'bateria');
  raise exception 'aluno não deveria criar curso';
exception
  when insufficient_privilege then null;
end;
$$;

-- Aluno não lê dados de responsáveis.
do $$
begin
  assert (select count(*) from public.responsaveis) = 0,
    'aluno não deveria ver responsáveis';
end;
$$;

reset role;

do $$
begin
  assert (select papel from public.perfis where id = '00000000-0000-0000-0000-0000000000a1')
    = 'aluno', 'o papel do aluno deveria continuar aluno';
end;
$$;
