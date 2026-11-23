-- B3: mover_item troca a ordem na mesma transação, renumera a lista, respeita
-- a RLS (só o professor) e aguenta dois cliques seguidos.

-- Mais dois módulos no curso c1, com ordens repetidas e com buraco, como as
-- que o código antigo podia deixar pela metade.
insert into public.modulos (id, curso_id, titulo, ordem) values
  ('d0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000001', 'Ritmo', 1),
  ('d0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000001', 'Solo', 7);

set local role authenticated;

-- O aluno matriculado vê os módulos, mas não muda a ordem.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

do $$
begin
  perform public.mover_item('modulos', 'd0000000-0000-0000-0000-000000000011', 'subir');
  raise exception 'o aluno não deveria mudar a ordem';
exception
  when insufficient_privilege then null;
end;
$$;

-- Sem login também não.
select set_config('request.jwt.claim.sub', '', true);

do $$
begin
  perform public.mover_item('aulas', 'e0000000-0000-0000-0000-000000000002', 'subir');
  raise exception 'sem login não deveria mudar a ordem';
exception
  when insufficient_privilege then null;
end;
$$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

do $$
declare
  ordem_atual text;
begin
  -- Tabela, direção e item inválidos são recusados.
  begin
    perform public.mover_item('perfis', 'd0000000-0000-0000-0000-000000000011', 'subir');
    raise exception 'tabela fora da lista deveria ser recusada';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.mover_item('modulos', 'd0000000-0000-0000-0000-000000000011', 'lado');
    raise exception 'direção inválida deveria ser recusada';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.mover_item('modulos', 'd0000000-0000-0000-0000-0000000000ff', 'subir');
    raise exception 'item inexistente deveria ser recusado';
  exception when no_data_found then null;
  end;

  -- Ordem inicial (ordem, id): Acordes(1, ...01), Ritmo(1, ...11), Solo(7).
  -- Descer Acordes: Ritmo, Acordes, Solo, renumerados 0, 1, 2.
  assert public.mover_item('modulos', 'd0000000-0000-0000-0000-000000000001', 'descer'),
    'deveria ter movido';
  select string_agg(titulo || '=' || ordem, ',' order by ordem) into ordem_atual
  from public.modulos where curso_id = 'c0000000-0000-0000-0000-000000000001';
  assert ordem_atual = 'Ritmo=0,Acordes=1,Solo=2',
    format('descer deveria trocar e renumerar, ficou %s', ordem_atual);

  -- Dois cliques seguidos em "descer" no mesmo item: cada um parte da ordem
  -- gravada pelo anterior. Ritmo desce duas vezes e vai para o fim.
  assert public.mover_item('modulos', 'd0000000-0000-0000-0000-000000000011', 'descer');
  assert public.mover_item('modulos', 'd0000000-0000-0000-0000-000000000011', 'descer');
  select string_agg(titulo || '=' || ordem, ',' order by ordem) into ordem_atual
  from public.modulos where curso_id = 'c0000000-0000-0000-0000-000000000001';
  assert ordem_atual = 'Acordes=0,Solo=1,Ritmo=2',
    format('dois cliques deveriam descer duas posições, ficou %s', ordem_atual);

  -- No fim da lista, descer não faz nada (o terceiro clique de quem insiste).
  assert not public.mover_item('modulos', 'd0000000-0000-0000-0000-000000000011', 'descer'),
    'o último não deveria descer';
  assert not public.mover_item('modulos', 'd0000000-0000-0000-0000-000000000001', 'subir'),
    'o primeiro não deveria subir';
  select string_agg(titulo || '=' || ordem, ',' order by ordem) into ordem_atual
  from public.modulos where curso_id = 'c0000000-0000-0000-0000-000000000001';
  assert ordem_atual = 'Acordes=0,Solo=1,Ritmo=2', 'a ordem não deveria mudar';

  -- Os módulos de outro curso não mudam.
  assert (select ordem from public.modulos where id = 'd0000000-0000-0000-0000-000000000002') = 1,
    'módulo de outro curso não deveria mudar';

  -- Aulas: Pestana sobe acima de Lá menor.
  assert public.mover_item('aulas', 'e0000000-0000-0000-0000-000000000002', 'subir');
  assert (select string_agg(titulo, ',' order by ordem) from public.aulas
          where modulo_id = 'd0000000-0000-0000-0000-000000000001') = 'Pestana,Lá menor',
    'a aula deveria subir';

  -- Blocos: a Prova sobe acima do Vídeo.
  assert public.mover_item('conteudos', 'f0000000-0000-0000-0000-000000000002', 'subir');
  assert (select string_agg(titulo, ',' order by ordem) from public.conteudos
          where aula_id = 'e0000000-0000-0000-0000-000000000001') = 'Prova,Vídeo',
    'o bloco deveria subir';
end;
$$;
