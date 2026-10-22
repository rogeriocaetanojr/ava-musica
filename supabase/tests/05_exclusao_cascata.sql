-- Apagar o usuário em auth.users apaga tudo dele em cascata.

insert into public.progresso (aluno_id, aula_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'e0000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-0000000000b1', 'e0000000-0000-0000-0000-000000000001');

delete from auth.users
where id in ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1');

do $$
declare
  alunos uuid[] := array[
    '00000000-0000-0000-0000-0000000000a1'::uuid,
    '00000000-0000-0000-0000-0000000000b1'::uuid
  ];
begin
  assert not exists (select 1 from public.perfis where id = any (alunos)),
    'os perfis deveriam ter sido apagados';
  assert not exists (select 1 from public.matriculas where aluno_id = any (alunos)),
    'as matrículas deveriam ter sido apagadas';
  assert not exists (select 1 from public.progresso where aluno_id = any (alunos)),
    'o progresso deveria ter sido apagado';
  assert not exists (select 1 from public.responsaveis where aluno_id = any (alunos)),
    'os dados do responsável deveriam ter sido apagados';

  -- O conteúdo do professor continua intacto.
  assert (select count(*) from public.cursos) = 3, 'os cursos não deveriam ser afetados';
  assert (select count(*) from public.perfis) = 1, 'só o perfil do professor deveria restar';
end;
$$;
