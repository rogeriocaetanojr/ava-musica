-- Pedidos de acesso: quem se cadastra sozinho fica pendente e sem acesso,
-- metadados forjados não liberam ninguém, só o professor libera ou recusa
-- (com auditoria), o menor de 12 liberado ainda depende do aceite e o
-- bloqueio continua sendo a revogação.

-- p1 entra pelo Google tentando se passar por cadastrado (metadados do usuário).
-- p2 entra pelo Google e vai ser liberado como menor de 12.
-- p3 entra pelo Google e vai ser recusado.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000e1', 'google1@testes-banco.local',
   '{"full_name": "Pedido Um", "origem": "professor", "menor_de_12": false, "data_nascimento": "2000-01-01"}'),
  ('00000000-0000-0000-0000-0000000000e2', 'google2@testes-banco.local',
   '{"name": "Pedido Dois"}'),
  ('00000000-0000-0000-0000-0000000000e3', 'google3@testes-banco.local',
   '{"full_name": "Pedido Três"}');

-- Matriculado num curso publicado: mesmo assim não pode ver nada.
insert into public.matriculas (aluno_id, curso_id) values
  ('00000000-0000-0000-0000-0000000000e1', 'c0000000-0000-0000-0000-000000000001');

do $$
begin
  assert (select liberado_em is null and data_nascimento is null and not menor_de_12
            and nome = 'Pedido Um' and papel = 'aluno'
          from public.perfis where id = '00000000-0000-0000-0000-0000000000e1'),
    'quem se cadastra sozinho deveria nascer pendente, sem nascimento e com o nome do Google';
  assert (select nome = 'Pedido Dois' from public.perfis
          where id = '00000000-0000-0000-0000-0000000000e2'),
    'o nome deveria vir de "name" quando não há "full_name"';
  assert (select liberado_em is not null from public.perfis
          where id = '00000000-0000-0000-0000-0000000000a1'),
    'o cadastro feito pelo professor deveria nascer liberado';
end;
$$;

set local role authenticated;

-- O pendente não vê cursos, aulas, avisos nem matrículas.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e1', true);

do $$
begin
  assert not public.aluno_liberado(), 'o pendente não deveria estar liberado';
  assert (select count(*) from public.cursos) = 0, 'o pendente não deveria ver cursos';
  assert (select count(*) from public.aulas) = 0, 'o pendente não deveria ver aulas';
  assert (select count(*) from public.avisos) = 0, 'o pendente não deveria ver avisos';
  assert (select count(*) from public.matriculas) = 0, 'o pendente não deveria ver matrículas';
  assert (select count(*) from public.perfis) = 1, 'o pendente deveria ver só o próprio perfil';
end;
$$;

-- O pendente não se libera, nem pela função nem pela tabela.
do $$
begin
  perform public.liberar_aluno('00000000-0000-0000-0000-0000000000e1', '2000-01-01');
  raise exception 'o pendente não deveria se liberar';
exception
  when insufficient_privilege then null;
end;
$$;

update public.perfis set liberado_em = now() where id = auth.uid();

do $$
begin
  perform public.registrar_recusa('00000000-0000-0000-0000-0000000000e3');
  raise exception 'o aluno não deveria recusar pedidos';
exception
  when insufficient_privilege then null;
end;
$$;

-- O professor também não muda a coluna direto (pularia a auditoria).
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

do $$
begin
  update public.perfis set liberado_em = now()
  where id = '00000000-0000-0000-0000-0000000000e1';
  raise exception 'o professor não deveria liberar sem a função';
exception
  when insufficient_privilege then null;
end;
$$;

-- Nascimento no futuro é recusado.
do $$
begin
  perform public.liberar_aluno('00000000-0000-0000-0000-0000000000e1', '2999-01-01');
  raise exception 'nascimento no futuro deveria ser recusado';
exception
  when invalid_parameter_value then null;
end;
$$;

-- O professor libera p1 como adulto e p2 como menor de 12, e recusa p3.
select public.liberar_aluno('00000000-0000-0000-0000-0000000000e1', '2000-01-01');
select public.liberar_aluno(
  '00000000-0000-0000-0000-0000000000e2',
  ((now() at time zone 'America/Sao_Paulo')::date - interval '10 years')::date
);
select public.registrar_recusa('00000000-0000-0000-0000-0000000000e3');

-- Liberar de novo não vale: o pedido já não está pendente.
do $$
begin
  perform public.liberar_aluno('00000000-0000-0000-0000-0000000000e1', '2000-01-01');
  raise exception 'liberar duas vezes deveria falhar';
exception
  when no_data_found then null;
end;
$$;

do $$
begin
  perform public.registrar_recusa('00000000-0000-0000-0000-0000000000e1');
  raise exception 'recusar um aluno liberado deveria falhar';
exception
  when no_data_found then null;
end;
$$;

do $$
begin
  assert (select count(*) from public.auditoria
          where aluno_id = '00000000-0000-0000-0000-0000000000e1' and acao = 'liberar') = 1,
    'a liberação do adulto deveria ser registrada';
  assert (select count(*) from public.auditoria
          where aluno_id = '00000000-0000-0000-0000-0000000000e2' and acao = 'liberar') = 1,
    'a liberação do menor deveria ser registrada';
  assert (select count(*) from public.auditoria
          where aluno_id = '00000000-0000-0000-0000-0000000000e3' and acao = 'recusar') = 1,
    'a recusa deveria ser registrada';
  assert (select menor_de_12 from public.perfis
          where id = '00000000-0000-0000-0000-0000000000e2'),
    'o banco deveria marcar o menor de 12 pela data informada';
end;
$$;

-- Liberado, p1 vê o curso em que está matriculado.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e1', true);

do $$
begin
  assert public.aluno_liberado(), 'o aluno liberado deveria ter acesso';
  assert (select count(*) from public.cursos) = 1, 'o aluno liberado deveria ver o curso matriculado';
end;
$$;

-- p2 foi liberado, mas é menor de 12 e ainda não tem aceite.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e2', true);

do $$
begin
  assert not public.aluno_liberado(), 'o menor de 12 sem aceite não deveria ter acesso';
end;
$$;

-- O bloqueio continua sendo a revogação de quem foi liberado.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select public.definir_bloqueio('00000000-0000-0000-0000-0000000000e1', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e1', true);

do $$
begin
  assert not public.aluno_liberado(), 'o aluno bloqueado não deveria ter acesso';
  assert (select count(*) from public.cursos) = 0, 'o aluno bloqueado não deveria ver cursos';
end;
$$;

reset role;

-- O app_metadata gravado depois da criação (só a chave de serviço consegue)
-- libera o cadastro com os dados informados pelo professor.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000e4', 'tardio@testes-banco.local',
   '{"nome": "Tardio", "data_nascimento": "2011-02-03", "menor_de_12": false}');
update auth.users set raw_app_meta_data = '{"origem": "professor"}'
where id = '00000000-0000-0000-0000-0000000000e4';

do $$
begin
  assert (select liberado_em is not null and data_nascimento = '2011-02-03'
          from public.perfis where id = '00000000-0000-0000-0000-0000000000e4'),
    'o app_metadata gravado depois deveria liberar o cadastro do professor';
  assert (select liberado_em is not null from public.perfis
          where id = '00000000-0000-0000-0000-0000000000e1'),
    'o bloqueio não desfaz a liberação: desbloquear devolve o acesso';
end;
$$;
