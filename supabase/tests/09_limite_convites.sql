-- O banco recusa o 21º convite do professor na mesma hora.

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

insert into public.envios_convite select from generate_series(1, 20);

do $$
begin
  assert public.convites_na_ultima_hora() = 20, 'deveria contar 20 envios';
  insert into public.envios_convite default values;
  raise exception 'o 21º convite na mesma hora deveria ser recusado';
exception
  when insufficient_privilege then null;
end;
$$;

-- Aluno não registra envio de convite.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

do $$
begin
  insert into public.envios_convite default values;
  raise exception 'o aluno não deveria registrar convites';
exception
  when insufficient_privilege then null;
end;
$$;
