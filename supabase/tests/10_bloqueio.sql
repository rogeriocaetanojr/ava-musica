-- Bloqueio: o aluno bloqueado perde o acesso na hora, os dados ficam
-- guardados, só o professor bloqueia (pela função, com auditoria) e o
-- desbloqueio devolve o acesso.

-- Um aluno adulto, para conferir que a auditoria do bloqueio vale para qualquer idade.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000d1', 'adulto@testes-banco.local',
   '{"nome": "Adulto", "data_nascimento": "1990-01-01", "menor_de_12": false}');

insert into public.progresso (aluno_id, aula_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'e0000000-0000-0000-0000-000000000001');

set local role authenticated;

-- O aluno não se bloqueia nem se desbloqueia.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

do $$
begin
  perform public.definir_bloqueio('00000000-0000-0000-0000-0000000000a1', false);
  raise exception 'o aluno não deveria mudar o próprio bloqueio';
exception
  when insufficient_privilege then null;
end;
$$;

-- O professor bloqueia o aluno de 14 anos e o adulto.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select public.definir_bloqueio('00000000-0000-0000-0000-0000000000a1', true);
select public.definir_bloqueio('00000000-0000-0000-0000-0000000000d1', true);

do $$
begin
  assert (select bloqueado_em is not null from public.perfis
          where id = '00000000-0000-0000-0000-0000000000a1'),
    'o aluno deveria ficar bloqueado';
  assert (select count(*) from public.auditoria
          where aluno_id = '00000000-0000-0000-0000-0000000000a1' and acao = 'bloquear') = 1,
    'o bloqueio do menor de 18 deveria ser registrado';
  assert (select count(*) from public.auditoria
          where aluno_id = '00000000-0000-0000-0000-0000000000d1' and acao = 'bloquear') = 1,
    'o bloqueio do adulto também deveria ser registrado';
end;
$$;

-- Nem o professor muda a coluna direto, sem passar pela auditoria.
do $$
begin
  update public.perfis set bloqueado_em = null
  where id = '00000000-0000-0000-0000-0000000000a1';
  raise exception 'o professor não deveria desbloquear sem a função';
exception
  when insufficient_privilege then null;
end;
$$;

-- O professor não pode ser bloqueado.
do $$
begin
  perform public.definir_bloqueio('00000000-0000-0000-0000-000000000001', true);
  raise exception 'o professor não deveria ser bloqueado';
exception
  when no_data_found then null;
end;
$$;

-- O aluno bloqueado, ainda com a sessão aberta, não vê nada.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

do $$
begin
  assert not public.aluno_liberado(), 'o aluno bloqueado não deveria estar liberado';
  assert (select count(*) from public.cursos) = 0, 'o bloqueado não deveria ver cursos';
  assert (select count(*) from public.modulos) = 0, 'o bloqueado não deveria ver módulos';
  assert (select count(*) from public.aulas) = 0, 'o bloqueado não deveria ver aulas';
  assert (select count(*) from public.conteudos) = 0, 'o bloqueado não deveria ver conteúdos';
  assert (select count(*) from public.matriculas) = 0, 'o bloqueado não deveria ver matrículas';
  assert (select count(*) from public.avisos) = 0, 'o bloqueado não deveria ver avisos';
  assert (select count(*) from public.progresso) = 0, 'o bloqueado não deveria ver o progresso';
end;
$$;

do $$
begin
  insert into public.progresso (aluno_id, aula_id, conteudo_id)
  values ('00000000-0000-0000-0000-0000000000a1', 'e0000000-0000-0000-0000-000000000001',
          'f0000000-0000-0000-0000-000000000002');
  raise exception 'o bloqueado não deveria registrar progresso';
exception
  when insufficient_privilege then null;
end;
$$;

do $$
begin
  update public.perfis set bloqueado_em = null
  where id = '00000000-0000-0000-0000-0000000000a1';
  assert (select bloqueado_em is not null from public.perfis
          where id = '00000000-0000-0000-0000-0000000000a1'),
    'o aluno não deveria se desbloquear';
end;
$$;

-- Os dados e o progresso continuam guardados.
reset role;

do $$
begin
  assert (select count(*) from public.matriculas
          where aluno_id = '00000000-0000-0000-0000-0000000000a1') = 2,
    'as matrículas deveriam continuar guardadas';
  assert (select count(*) from public.progresso
          where aluno_id = '00000000-0000-0000-0000-0000000000a1') = 1,
    'o progresso deveria continuar guardado';
end;
$$;

-- O professor desbloqueia e o acesso volta.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select public.definir_bloqueio('00000000-0000-0000-0000-0000000000a1', false);

do $$
begin
  assert (select count(*) from public.auditoria
          where aluno_id = '00000000-0000-0000-0000-0000000000a1' and acao = 'desbloquear') = 1,
    'o desbloqueio deveria ser registrado';
end;
$$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

do $$
begin
  assert public.aluno_liberado(), 'o aluno desbloqueado deveria estar liberado';
  assert (select array_agg(id) from public.cursos)
    = array['c0000000-0000-0000-0000-000000000001'::uuid],
    'o aluno desbloqueado deveria voltar a ver o curso';
  assert (select count(*) from public.progresso) = 1,
    'o aluno desbloqueado deveria voltar a ver o progresso';
end;
$$;
