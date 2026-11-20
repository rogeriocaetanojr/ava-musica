-- Progresso contado no banco, por aluno e curso (B1 da auditoria).
--
-- O painel do professor lia todos os registros de progresso e contava na
-- aplicação, mas a API do Supabase devolve no máximo 1000 linhas por consulta
-- (max_rows): passado esse número, os percentuais saíam errados sem aviso.
-- Agora o banco devolve uma linha por aluno e curso com as contagens prontas.
--
-- security invoker: a função roda com as permissões de quem chama, então a
-- RLS de progresso, aulas, módulos e conteúdos continua valendo. O professor
-- vê todos; o aluno, só o próprio progresso em aulas visíveis.

create function public.progresso_por_curso(p_aluno uuid default null)
returns table (
  aluno_id uuid,
  curso_id uuid,
  aulas_concluidas integer,
  provas_enviadas integer,
  ultima_aula_id uuid,
  ultima_aula_em timestamptz,
  aulas_na_semana integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    p.aluno_id,
    mo.curso_id,
    -- Mesma regra da tela do aluno: só aulas publicadas contam.
    (count(*) filter (where p.conteudo_id is null and a.publicada))::integer,
    (count(*) filter (
      where p.conteudo_id is not null and a.publicada and c.tipo = 'prova'
    ))::integer,
    (array_agg(p.aula_id order by p.concluido_em desc)
      filter (where p.conteudo_id is null and a.publicada))[1],
    max(p.concluido_em) filter (where p.conteudo_id is null and a.publicada),
    (count(*) filter (
      where p.conteudo_id is null and p.concluido_em >= now() - interval '7 days'
    ))::integer
  from public.progresso p
  join public.aulas a on a.id = p.aula_id
  join public.modulos mo on mo.id = a.modulo_id
  left join public.conteudos c on c.id = p.conteudo_id
  where progresso_por_curso.p_aluno is null
     or p.aluno_id = progresso_por_curso.p_aluno
  group by p.aluno_id, mo.curso_id;
$$;

revoke all on function public.progresso_por_curso(uuid) from public, anon;
grant execute on function public.progresso_por_curso(uuid) to authenticated;
