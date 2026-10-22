-- Aluno não vê aula em rascunho nem registra progresso nela.

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

do $$
begin
  assert (select array_agg(id) from public.aulas)
    = array['e0000000-0000-0000-0000-000000000001'::uuid],
    'aluno deveria ver só a aula publicada do curso publicado';

  assert not exists (
    select 1 from public.conteudos where aula_id = 'e0000000-0000-0000-0000-000000000002'
  ), 'aluno não deveria ver conteúdo de aula em rascunho';
  assert (select count(*) from public.conteudos) = 2,
    'aluno deveria ver os 2 conteúdos da aula publicada';
end;
$$;

-- Concluir aula em rascunho é recusado.
do $$
begin
  insert into public.progresso (aluno_id, aula_id)
  values ('00000000-0000-0000-0000-0000000000a1', 'e0000000-0000-0000-0000-000000000002');
  raise exception 'aluno não deveria concluir aula em rascunho';
exception
  when insufficient_privilege then null;
end;
$$;

-- Gravar progresso em nome de outro aluno é recusado.
do $$
begin
  insert into public.progresso (aluno_id, aula_id)
  values ('00000000-0000-0000-0000-0000000000b1', 'e0000000-0000-0000-0000-000000000001');
  raise exception 'aluno não deveria gravar progresso de outro aluno';
exception
  when insufficient_privilege then null;
end;
$$;

-- Concluir a aula publicada funciona, e repetir não duplica (unique nulls not distinct).
insert into public.progresso (aluno_id, aula_id)
values ('00000000-0000-0000-0000-0000000000a1', 'e0000000-0000-0000-0000-000000000001')
on conflict do nothing;
insert into public.progresso (aluno_id, aula_id)
values ('00000000-0000-0000-0000-0000000000a1', 'e0000000-0000-0000-0000-000000000001')
on conflict do nothing;

-- Marcar a prova da mesma aula gera um segundo registro.
insert into public.progresso (aluno_id, aula_id, conteudo_id)
values (
  '00000000-0000-0000-0000-0000000000a1',
  'e0000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000002'
);

do $$
begin
  assert (select count(*) from public.progresso) = 2,
    'deveria haver 1 registro de aula concluída e 1 de prova enviada';
end;
$$;
