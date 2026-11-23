-- B8: o professor exclui curso, módulo e aula; a cascata leva aulas, blocos e
-- o progresso dos alunos (e, no curso, matrículas e recados); a exclusão fica
-- na auditoria; o aluno não exclui nada; o resumo conta o que vai junto.

insert into public.progresso (aluno_id, aula_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'e0000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-0000000000b1', 'e0000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-0000000000a1', 'e0000000-0000-0000-0000-000000000003');
insert into public.progresso (aluno_id, aula_id, conteudo_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'e0000000-0000-0000-0000-000000000001',
   'f0000000-0000-0000-0000-000000000002');

set local role authenticated;

-- O aluno não exclui nem pelo banco direto.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

do $$
begin
  perform public.excluir_item('cursos', 'c0000000-0000-0000-0000-000000000001');
  raise exception 'o aluno não deveria excluir o curso';
exception
  when insufficient_privilege then null;
end;
$$;

delete from public.aulas where id = 'e0000000-0000-0000-0000-000000000001';

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

do $$
declare
  r record;
begin
  assert exists (select 1 from public.aulas where id = 'e0000000-0000-0000-0000-000000000001'),
    'o delete do aluno não deveria apagar a aula';

  -- Resumo do curso c1: 1 módulo, 2 aulas, 3 blocos, 2 alunos com progresso,
  -- 2 matrículas e 1 recado.
  select * into r from public.resumo_da_exclusao('c0000000-0000-0000-0000-000000000001')
  where tipo = 'curso';
  assert (r.modulos, r.aulas, r.conteudos, r.alunos_com_progresso, r.matriculas, r.avisos)
    = (1, 2, 3, 2, 2, 1), format('resumo do curso errado: %s', r);

  select * into r from public.resumo_da_exclusao('c0000000-0000-0000-0000-000000000001')
  where id = 'e0000000-0000-0000-0000-000000000002';
  assert (r.tipo, r.conteudos, r.alunos_com_progresso) = ('aula', 1, 0),
    format('resumo da aula em rascunho errado: %s', r);

  -- Tabela e item inválidos.
  begin
    perform public.excluir_item('perfis', '00000000-0000-0000-0000-0000000000a1');
    raise exception 'tabela fora da lista deveria ser recusada';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.excluir_item('aulas', 'e0000000-0000-0000-0000-0000000000ff');
    raise exception 'item inexistente deveria ser recusado';
  exception when no_data_found then null;
  end;

  -- Excluir a aula e1 leva os blocos e o progresso dela.
  perform public.excluir_item('aulas', 'e0000000-0000-0000-0000-000000000001');
  assert not exists (select 1 from public.aulas where id = 'e0000000-0000-0000-0000-000000000001');
  assert not exists (select 1 from public.conteudos where aula_id = 'e0000000-0000-0000-0000-000000000001'),
    'os blocos da aula deveriam ir junto';
  assert not exists (select 1 from public.progresso where aula_id = 'e0000000-0000-0000-0000-000000000001'),
    'o progresso da aula deveria ir junto';
  assert exists (select 1 from public.aulas where id = 'e0000000-0000-0000-0000-000000000002'),
    'a outra aula do módulo deveria ficar';

  -- Excluir o módulo do curso em rascunho leva a aula e3 e o progresso.
  perform public.excluir_item('modulos', 'd0000000-0000-0000-0000-000000000003');
  assert not exists (select 1 from public.aulas where id = 'e0000000-0000-0000-0000-000000000003');
  assert not exists (select 1 from public.progresso where aula_id = 'e0000000-0000-0000-0000-000000000003');
  assert exists (select 1 from public.cursos where id = 'c0000000-0000-0000-0000-000000000003'),
    'o curso do módulo deveria ficar';

  -- Excluir o curso c1 leva módulos, aulas, matrículas e o recado dele.
  perform public.excluir_item('cursos', 'c0000000-0000-0000-0000-000000000001');
  assert not exists (select 1 from public.modulos where curso_id = 'c0000000-0000-0000-0000-000000000001');
  assert not exists (select 1 from public.aulas where id = 'e0000000-0000-0000-0000-000000000002');
  assert not exists (select 1 from public.matriculas where curso_id = 'c0000000-0000-0000-0000-000000000001');
  assert not exists (select 1 from public.avisos where curso_id = 'c0000000-0000-0000-0000-000000000001');
  assert exists (select 1 from public.avisos where curso_id is null), 'o recado geral deveria ficar';
  assert exists (select 1 from public.cursos where id = 'c0000000-0000-0000-0000-000000000002'),
    'os outros cursos deveriam ficar';
  assert exists (select 1 from public.perfis where id = '00000000-0000-0000-0000-0000000000a1'),
    'os alunos deveriam ficar';

  -- A auditoria tem as três exclusões, com id e título, sem aluno.
  assert (select count(*) from public.auditoria
          where ator_id = '00000000-0000-0000-0000-000000000001' and aluno_id is null
            and (acao, item_id, item_titulo) in (
              ('excluir_aula', 'e0000000-0000-0000-0000-000000000001', 'Lá menor'),
              ('excluir_modulo', 'd0000000-0000-0000-0000-000000000003', 'Ritmos'),
              ('excluir_curso', 'c0000000-0000-0000-0000-000000000001', 'Violão I'))) = 3,
    'as três exclusões deveriam estar na auditoria';
end;
$$;

-- A falha na exclusão não deixa registro: aula inexistente não entra na auditoria.
do $$
begin
  assert not exists (select 1 from public.auditoria
                     where item_id = 'e0000000-0000-0000-0000-0000000000ff'),
    'exclusão que falhou não deveria ficar na auditoria';
end;
$$;

reset role;

-- A auditoria não aceita exclusão sem item nem mistura de aluno e item.
do $$
begin
  begin
    insert into public.auditoria (ator_id, acao) values
      ('00000000-0000-0000-0000-000000000001', 'excluir_curso');
    raise exception 'exclusão sem item deveria ser recusada';
  exception when check_violation then null;
  end;
  begin
    insert into public.auditoria (ator_id, acao) values
      ('00000000-0000-0000-0000-000000000001', 'abrir');
    raise exception 'ação de aluno sem aluno deveria ser recusada';
  exception when check_violation then null;
  end;
end;
$$;
