-- Menor de 12 sem aceite do responsável não vê nada; com aceite, passa a ver.

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);

do $$
begin
  assert not public.aluno_liberado(), 'menor sem aceite não deveria estar liberado';
  assert (select count(*) from public.cursos) = 0, 'menor sem aceite não deveria ver cursos';
  assert (select count(*) from public.modulos) = 0, 'menor sem aceite não deveria ver módulos';
  assert (select count(*) from public.aulas) = 0, 'menor sem aceite não deveria ver aulas';
  assert (select count(*) from public.conteudos) = 0, 'menor sem aceite não deveria ver conteúdos';
  assert (select count(*) from public.matriculas) = 0, 'menor sem aceite não deveria ver matrículas';
  assert (select count(*) from public.avisos) = 0, 'menor sem aceite não deveria ver avisos';
  assert (select count(*) from public.responsaveis) = 0, 'menor não deveria ver responsáveis';
end;
$$;

do $$
begin
  insert into public.progresso (aluno_id, aula_id)
  values ('00000000-0000-0000-0000-0000000000b1', 'e0000000-0000-0000-0000-000000000001');
  raise exception 'menor sem aceite não deveria registrar progresso';
exception
  when insufficient_privilege then null;
end;
$$;

-- O responsável dá o aceite (feito pelo servidor com o cliente admin).
reset role;
update public.responsaveis set aceito_em = now(), versao_termos = '1'
where aluno_id = '00000000-0000-0000-0000-0000000000b1';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);

do $$
begin
  assert public.aluno_liberado(), 'menor com aceite deveria estar liberado';
  assert (select array_agg(id) from public.cursos)
    = array['c0000000-0000-0000-0000-000000000001'::uuid],
    'menor com aceite deveria ver o curso em que está matriculado';
end;
$$;
