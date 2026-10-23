-- Auditoria: só o professor lê, ninguém altera nem apaga, e o registro
-- sobrevive à exclusão do aluno.

-- Um aluno adulto, que não gera registro.
insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000d1', 'adulto@testes-banco.local', '{"origem": "professor"}',
   '{"nome": "Adulto", "data_nascimento": "1990-01-01", "menor_de_12": false}');

set local role authenticated;

-- Professor registra o acesso ao aluno de 14 anos e ao adulto.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select public.registrar_acesso('abrir', '00000000-0000-0000-0000-0000000000a1');
select public.registrar_acesso('abrir', '00000000-0000-0000-0000-0000000000d1');

do $$
begin
  assert (select count(*) from public.auditoria
          where aluno_id = '00000000-0000-0000-0000-0000000000a1') = 1,
    'o acesso ao menor de 18 deveria ser registrado';
  assert not exists (select 1 from public.auditoria
                     where aluno_id = '00000000-0000-0000-0000-0000000000d1'),
    'o acesso ao maior de 18 não deveria ser registrado';
end;
$$;

-- Nem o professor grava direto na tabela, altera ou apaga.
do $$
begin
  insert into public.auditoria (ator_id, acao, aluno_id)
  values ('00000000-0000-0000-0000-000000000001', 'abrir', '00000000-0000-0000-0000-0000000000a1');
  raise exception 'o professor não deveria gravar direto na auditoria';
exception
  when insufficient_privilege then null;
end;
$$;

do $$
begin
  update public.auditoria set acao = 'excluir';
  raise exception 'o professor não deveria alterar a auditoria';
exception
  when insufficient_privilege then null;
end;
$$;

do $$
begin
  delete from public.auditoria;
  raise exception 'o professor não deveria apagar a auditoria';
exception
  when insufficient_privilege then null;
end;
$$;

-- Aluno não lê a auditoria (nem a sobre ele) e não registra acessos.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

do $$
begin
  assert (select count(*) from public.auditoria) = 0,
    'o aluno não deveria ler a auditoria';
end;
$$;

do $$
begin
  perform public.registrar_acesso('abrir', '00000000-0000-0000-0000-0000000000a1');
  raise exception 'o aluno não deveria registrar acessos';
exception
  when insufficient_privilege then null;
end;
$$;

-- Nem o dono do banco (que ignora RLS e permissões) altera ou apaga.
reset role;

do $$
begin
  update public.auditoria set acao = 'excluir';
  raise exception 'ninguém deveria alterar a auditoria';
exception
  when insufficient_privilege then null;
end;
$$;

do $$
begin
  delete from public.auditoria;
  raise exception 'ninguém deveria apagar a auditoria';
exception
  when insufficient_privilege then null;
end;
$$;

-- Excluir o aluno não apaga o registro, que guarda só o id.
delete from auth.users where id = '00000000-0000-0000-0000-0000000000a1';

do $$
begin
  assert (select count(*) from public.auditoria
          where aluno_id = '00000000-0000-0000-0000-0000000000a1') = 1,
    'o registro deveria continuar depois da exclusão do aluno';
end;
$$;
