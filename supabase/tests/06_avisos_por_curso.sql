-- Aviso de um curso só aparece para os alunos matriculados nele.

-- Um segundo aluno, matriculado só no curso c2 (Piano I).
insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000c1', 'pianista@testes-banco.local', '{"origem": "professor"}',
   '{"nome": "Pianista", "data_nascimento": "2010-01-15", "menor_de_12": false}');
insert into public.matriculas (aluno_id, curso_id) values
  ('00000000-0000-0000-0000-0000000000c1', 'c0000000-0000-0000-0000-000000000002');

-- Aviso do curso em rascunho c3: nem o matriculado nele deve ver.
insert into public.avisos (titulo, texto, curso_id) values
  ('Violão II', 'Só para c3', 'c0000000-0000-0000-0000-000000000003');

set local role authenticated;

-- Aluno de c1 (e de c3, em rascunho): vê o geral e o de c1.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

do $$
begin
  assert (select array_agg(titulo order by titulo) from public.avisos)
    = array['Geral', 'Violão I'],
    'aluno de c1 deveria ver só o aviso geral e o de c1';
end;
$$;

-- Aluno de c2: vê o geral e o de c2, nunca o de c1.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', true);

do $$
begin
  assert (select array_agg(titulo order by titulo) from public.avisos)
    = array['Geral', 'Piano I'],
    'aluno de c2 deveria ver só o aviso geral e o de c2';
  assert not exists (
    select 1 from public.avisos
    where curso_id = 'c0000000-0000-0000-0000-000000000001'
  ), 'aluno não matriculado em c1 não deveria ver o aviso de c1';
end;
$$;

-- Menor de 12 sem aceite, matriculado em c1: não vê aviso nenhum.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);

do $$
begin
  assert (select count(*) from public.avisos) = 0,
    'menor sem aceite não deveria ver avisos';
end;
$$;

-- Aluno não consegue publicar aviso.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

do $$
begin
  insert into public.avisos (titulo, texto) values ('Falso', 'x');
  raise exception 'aluno não deveria conseguir publicar aviso';
exception
  when insufficient_privilege then null;
end;
$$;
