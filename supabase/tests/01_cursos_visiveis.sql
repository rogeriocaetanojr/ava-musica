-- Aluno só vê curso publicado em que está matriculado.

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

do $$
begin
  assert (select array_agg(id) from public.cursos)
    = array['c0000000-0000-0000-0000-000000000001'::uuid],
    'aluno deveria ver só o curso c1 (publicado e matriculado)';

  assert (select array_agg(id) from public.modulos)
    = array['d0000000-0000-0000-0000-000000000001'::uuid],
    'aluno deveria ver só os módulos do curso c1';

  assert (select count(*) from public.avisos) = 2,
    'aluno deveria ver o aviso geral e o do curso c1';
  assert not exists (select 1 from public.avisos where titulo = 'Piano I'),
    'aluno não deveria ver aviso de curso em que não está matriculado';

  assert (select count(*) from public.matriculas) = 2,
    'aluno deveria ver as próprias duas matrículas';
end;
$$;

-- Sem sessão (anon) não há acesso a nenhuma tabela.
reset role;
set local role anon;

do $$
begin
  perform 1 from public.cursos;
  raise exception 'anon não deveria conseguir ler cursos';
exception
  when insufficient_privilege then null;
end;
$$;

-- Professor vê tudo. As contagens olham só os dados de teste, porque o
-- banco local pode ter também as contas do seed:dev.
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

do $$
begin
  assert (select count(*) from public.cursos where id::text like 'c0000000-%') = 3, 'professor deveria ver os 3 cursos';
  assert (select count(*) from public.perfis where id::text like '00000000-0000-0000-0000-%') = 3, 'professor deveria ver os 3 perfis';
end;
$$;
