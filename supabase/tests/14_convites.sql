-- Só o professor lê e grava convites; aluno e visitante não veem nada.

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

insert into public.convites (aluno_id, codigo_hash)
values ('00000000-0000-0000-0000-0000000000a1', repeat('a', 64));

do $$
begin
  assert (select count(*) from public.convites
          where aluno_id = '00000000-0000-0000-0000-0000000000a1') = 1,
    'o professor deveria ver o convite que gravou';
  assert (select expira_em > now() + interval '6 days 23 hours'
          from public.convites
          where aluno_id = '00000000-0000-0000-0000-0000000000a1'),
    'o convite deveria valer 7 dias';
end;
$$;

do $$
begin
  insert into public.convites (aluno_id, codigo_hash)
  values ('00000000-0000-0000-0000-0000000000b1', 'codigo-em-texto');
  raise exception 'o banco deveria recusar código que não é hash';
exception
  when check_violation then null;
end;
$$;

-- Aluno não lê nem grava convites, nem o próprio.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

do $$
begin
  assert (select count(*) from public.convites) = 0,
    'o aluno não deveria ver convites';
  update public.convites set usado_em = now();
  assert not found, 'o aluno não deveria marcar convite como usado';
end;
$$;

do $$
begin
  insert into public.convites (aluno_id, codigo_hash)
  values ('00000000-0000-0000-0000-0000000000a1', repeat('b', 64));
  raise exception 'o aluno não deveria gravar convites';
exception
  when insufficient_privilege then null;
end;
$$;

reset role;
set local role anon;

do $$
begin
  perform 1 from public.convites;
  raise exception 'anon não deveria conseguir ler convites';
exception
  when insufficient_privilege then null;
end;
$$;
