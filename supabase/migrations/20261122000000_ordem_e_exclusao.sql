-- B3: troca de ordem de módulos, aulas e blocos numa transação só.
-- B8: exclusão de curso, módulo e aula pelo professor, com registro na auditoria.

-- ---------------------------------------------------------------------------
-- B3: mover_item
-- ---------------------------------------------------------------------------

-- Troca o item com o vizinho (acima ou abaixo) e renumera a lista de 0 a n-1,
-- o que também conserta ordens repetidas ou com buracos. Tudo na mesma
-- transação, com a linha do pai travada (FOR UPDATE): dois cliques seguidos
-- na mesma lista esperam um pelo outro e o segundo lê a ordem já gravada.
-- Roda com as permissões de quem chama (security invoker), então a RLS vale:
-- só o professor enxerga a lista para alterar, e o aluno recebe erro.
-- Devolve false quando não há o que mover (primeiro subindo, último descendo).
create function public.mover_item(tabela text, item uuid, direcao text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  pai_coluna text;
  pai_tabela text;
  pai uuid;
  posicao integer;
  vizinho integer;
  total integer;
begin
  if not public.eh_professor() then
    raise exception 'só o professor muda a ordem'
      using errcode = 'insufficient_privilege';
  end if;

  case tabela
    when 'modulos' then pai_coluna := 'curso_id'; pai_tabela := 'cursos';
    when 'aulas' then pai_coluna := 'modulo_id'; pai_tabela := 'modulos';
    when 'conteudos' then pai_coluna := 'aula_id'; pai_tabela := 'aulas';
    else raise exception 'tabela inválida: %', tabela using errcode = 'invalid_parameter_value';
  end case;

  if direcao not in ('subir', 'descer') then
    raise exception 'direção inválida: %', direcao using errcode = 'invalid_parameter_value';
  end if;

  execute format('select %I from public.%I where id = $1', pai_coluna, tabela)
    into pai using item;
  if pai is null then
    raise exception 'item não encontrado' using errcode = 'no_data_found';
  end if;

  -- Fila única por lista: o segundo clique espera o primeiro terminar.
  execute format('select 1 from public.%I where id = $1 for update', pai_tabela)
    using pai;

  execute format(
    'select pos, total from (
       select id, (row_number() over (order by ordem, id::text collate "C") - 1)::int as pos,
              count(*) over ()::int as total
       from public.%I where %I = $1
     ) lista where id = $2',
    tabela, pai_coluna)
    into posicao, total using pai, item;

  vizinho := case when direcao = 'subir' then posicao - 1 else posicao + 1 end;
  if vizinho < 0 or vizinho >= total then
    return false;
  end if;

  execute format(
    'update public.%1$I t set ordem = nova.ordem
     from (
       select id,
              case pos when $2 then $3 when $3 then $2 else pos end as ordem
       from (
         select id, (row_number() over (order by ordem, id::text collate "C") - 1)::int as pos
         from public.%1$I where %2$I = $1
       ) lista
     ) nova
     where t.id = nova.id and t.ordem <> nova.ordem',
    tabela, pai_coluna)
    using pai, posicao, vizinho;

  return true;
end;
$$;

revoke all on function public.mover_item(text, uuid, text) from public, anon;
grant execute on function public.mover_item(text, uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- B8: auditoria também para o conteúdo do professor
-- ---------------------------------------------------------------------------

-- A auditoria guardava só ações sobre alunos. A exclusão de curso, módulo ou
-- aula grava o id e o título do item apagado (não é dado pessoal), sem aluno.
alter table public.auditoria alter column aluno_id drop not null;
alter table public.auditoria add column item_id uuid;
alter table public.auditoria add column item_titulo text;

alter table public.auditoria drop constraint auditoria_acao_check;
alter table public.auditoria add constraint auditoria_acao_check
  check (acao in (
    'abrir', 'editar', 'matricular', 'desmatricular', 'excluir',
    'bloquear', 'desbloquear', 'liberar', 'recusar', 'permitir_pedido',
    'renomear', 'excluir_curso', 'excluir_modulo', 'excluir_aula'
  ));

-- Toda linha fala de um aluno ou de um item do professor.
alter table public.auditoria add constraint auditoria_aluno_ou_item
  check (
    (acao like 'excluir\_%' and item_id is not null and aluno_id is null)
    or (acao not like 'excluir\_%' and aluno_id is not null and item_id is null)
  );

create index on public.auditoria (item_id) where item_id is not null;

-- ---------------------------------------------------------------------------
-- B8: o que vai junto na exclusão
-- ---------------------------------------------------------------------------

-- Para a confirmação da tela: o que cada item do curso leva junto ao ser
-- apagado. Uma linha para o curso, uma por módulo e uma por aula.
-- Security invoker: o aluno não enxerga progresso alheio nem rascunhos.
create function public.resumo_da_exclusao(curso uuid)
returns table (
  tipo text,
  id uuid,
  modulos integer,
  aulas integer,
  conteudos integer,
  alunos_com_progresso integer,
  matriculas integer,
  avisos integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with a as (
    select au.id, au.modulo_id
    from public.aulas au
    join public.modulos m on m.id = au.modulo_id
    where m.curso_id = resumo_da_exclusao.curso
  )
  select 'curso', c.id,
    (select count(*)::int from public.modulos m where m.curso_id = c.id),
    (select count(*)::int from a),
    (select count(*)::int from public.conteudos ct where ct.aula_id in (select a.id from a)),
    (select count(distinct p.aluno_id)::int from public.progresso p where p.aula_id in (select a.id from a)),
    (select count(*)::int from public.matriculas mt where mt.curso_id = c.id),
    (select count(*)::int from public.avisos av where av.curso_id = c.id)
  from public.cursos c
  where c.id = resumo_da_exclusao.curso
  union all
  select 'modulo', m.id, 1,
    (select count(*)::int from a where a.modulo_id = m.id),
    (select count(*)::int from public.conteudos ct
       where ct.aula_id in (select a.id from a where a.modulo_id = m.id)),
    (select count(distinct p.aluno_id)::int from public.progresso p
       where p.aula_id in (select a.id from a where a.modulo_id = m.id)),
    0, 0
  from public.modulos m
  where m.curso_id = resumo_da_exclusao.curso
  union all
  select 'aula', a.id, 0, 1,
    (select count(*)::int from public.conteudos ct where ct.aula_id = a.id),
    (select count(distinct p.aluno_id)::int from public.progresso p where p.aula_id = a.id),
    0, 0
  from a;
$$;

revoke all on function public.resumo_da_exclusao(uuid) from public, anon;
grant execute on function public.resumo_da_exclusao(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- B8: excluir_item
-- ---------------------------------------------------------------------------

-- Apaga o curso, o módulo ou a aula e grava a auditoria na mesma transação.
-- A cascata do esquema leva junto módulos, aulas, blocos, progresso dos
-- alunos e, no caso do curso, as matrículas e os recados dele.
-- Security definer só para gravar a auditoria (a aplicação não insere nela);
-- por isso confere o professor aqui.
create function public.excluir_item(tabela text, item uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  titulo text;
begin
  if not public.eh_professor() then
    raise exception 'só o professor exclui cursos, módulos e aulas'
      using errcode = 'insufficient_privilege';
  end if;

  if tabela not in ('cursos', 'modulos', 'aulas') then
    raise exception 'tabela inválida: %', tabela using errcode = 'invalid_parameter_value';
  end if;

  execute format('delete from public.%I where id = $1 returning titulo', tabela)
    into titulo using item;
  if titulo is null then
    raise exception 'item não encontrado' using errcode = 'no_data_found';
  end if;

  insert into public.auditoria (ator_id, acao, item_id, item_titulo)
  values (
    auth.uid(),
    case tabela
      when 'cursos' then 'excluir_curso'
      when 'modulos' then 'excluir_modulo'
      else 'excluir_aula'
    end,
    item,
    titulo
  );
end;
$$;

revoke all on function public.excluir_item(text, uuid) from public, anon;
grant execute on function public.excluir_item(text, uuid) to authenticated;
