-- Pedidos de acesso: quem entra pelo Google sem ter sido cadastrado pelo
-- professor fica pendente até o professor liberar ou recusar. Depois de
-- liberado, a revogação é o bloqueio que já existe.

alter table public.perfis add column liberado_em timestamptz;
-- Quando o aviso de pedido novo foi mandado ao professor (uma vez só).
alter table public.perfis add column pedido_avisado_em timestamptz;

-- Todos os que já existem foram cadastrados pelo professor.
update public.perfis set liberado_em = criado_em;

create index on public.perfis (criado_em) where liberado_em is null;

-- ---------------------------------------------------------------------------
-- Gatilho de perfil
-- ---------------------------------------------------------------------------

-- O cadastro feito pelo professor leva app_metadata.origem = 'professor', que
-- só a chave de serviço grava, e nasce liberado com os dados que o professor
-- informou. Quem se cadastra sozinho nasce pendente e sem data de nascimento:
-- os metadados do usuário não são confiáveis com o cadastro aberto, então só
-- o nome é aproveitado. O papel continua fixo em 'aluno'.
create or replace function public.criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  do_professor boolean := coalesce(new.raw_app_meta_data ->> 'origem', '') = 'professor';
  metadados jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.perfis (
    id, nome, email, papel, data_nascimento, menor_de_12, liberado_em
  )
  values (
    new.id,
    left(coalesce(
      nullif(metadados ->> 'nome', ''),
      nullif(metadados ->> 'full_name', ''),
      nullif(metadados ->> 'name', ''),
      new.email
    ), 120),
    new.email,
    'aluno',
    case when do_professor then (metadados ->> 'data_nascimento')::date end,
    do_professor and coalesce((metadados ->> 'menor_de_12')::boolean, false),
    case when do_professor then now() end
  );
  return new;
end;
$$;

-- Se o Auth gravar o app_metadata depois de criar o usuário, o perfil é
-- liberado nessa hora, ainda com os dados informados pelo professor.
create function public.liberar_cadastro_do_professor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.raw_app_meta_data ->> 'origem', '') = 'professor'
     and coalesce(old.raw_app_meta_data ->> 'origem', '') <> 'professor' then
    update public.perfis
    set liberado_em = coalesce(liberado_em, now()),
        data_nascimento = (new.raw_user_meta_data ->> 'data_nascimento')::date,
        menor_de_12 = coalesce((new.raw_user_meta_data ->> 'menor_de_12')::boolean, false)
    where id = new.id and liberado_em is null;
  end if;
  return new;
end;
$$;

create trigger ao_marcar_cadastro_do_professor
  after update of raw_app_meta_data on auth.users
  for each row execute function public.liberar_cadastro_do_professor();

-- ---------------------------------------------------------------------------
-- Acesso do aluno
-- ---------------------------------------------------------------------------

-- Liberado pelo professor, não bloqueado e com 12 anos ou mais (ou menor com
-- aceite do responsável). Toda a RLS do aluno passa por aqui.
create or replace function public.aluno_liberado()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis p
    where p.id = auth.uid()
      and p.papel = 'aluno'
      and p.liberado_em is not null
      and p.bloqueado_em is null
      and (
        not p.menor_de_12
        or exists (
          select 1 from public.responsaveis r
          where r.aluno_id = p.id and r.aceito_em is not null
        )
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- Auditoria: novas ações
-- ---------------------------------------------------------------------------

alter table public.auditoria drop constraint auditoria_acao_check;
alter table public.auditoria add constraint auditoria_acao_check
  check (acao in (
    'abrir', 'editar', 'matricular', 'desmatricular', 'excluir',
    'bloquear', 'desbloquear', 'liberar', 'recusar'
  ));

-- ---------------------------------------------------------------------------
-- Liberação e recusa
-- ---------------------------------------------------------------------------

-- Só as funções abaixo (e os gatilhos do Auth) mudam liberado_em; o professor
-- que alterasse a coluna direto pularia a auditoria. O aviso ao professor é
-- marcado pelo servidor com a chave de serviço, por isso fica de fora.
create function public.liberacao_so_pela_funcao()
returns trigger
language plpgsql
as $$
begin
  if new.liberado_em is distinct from old.liberado_em
     and current_user in ('anon', 'authenticated', 'service_role') then
    raise exception 'a liberação só muda pela função liberar_aluno'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger liberacao_so_pela_funcao
  before update on public.perfis
  for each row execute function public.liberacao_so_pela_funcao();

-- Libera o pedido pendente com a data de nascimento informada pelo professor
-- e registra na auditoria, para qualquer idade. O menor de 12 continua sem
-- acesso até o aceite do responsável (aluno_liberado confere).
create function public.liberar_aluno(aluno uuid, nascimento date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if not public.eh_professor() then
    raise exception 'só o professor libera alunos'
      using errcode = 'insufficient_privilege';
  end if;
  if nascimento is null or nascimento > hoje then
    raise exception 'data de nascimento inválida'
      using errcode = 'invalid_parameter_value';
  end if;

  update public.perfis
  set liberado_em = now(),
      data_nascimento = liberar_aluno.nascimento,
      menor_de_12 = liberar_aluno.nascimento > hoje - interval '12 years'
  where id = liberar_aluno.aluno and papel = 'aluno' and liberado_em is null;

  if not found then
    raise exception 'pedido pendente não encontrado'
      using errcode = 'no_data_found';
  end if;

  insert into public.auditoria (ator_id, acao, aluno_id)
  values (auth.uid(), 'liberar', liberar_aluno.aluno);
end;
$$;

-- Registra a recusa de um pedido pendente. A conta é apagada em seguida pela
-- aplicação (Auth); a auditoria fica, só com o id.
create function public.registrar_recusa(aluno uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.eh_professor() then
    raise exception 'só o professor recusa pedidos'
      using errcode = 'insufficient_privilege';
  end if;

  if not exists (
    select 1 from public.perfis
    where id = registrar_recusa.aluno and papel = 'aluno' and liberado_em is null
  ) then
    raise exception 'pedido pendente não encontrado'
      using errcode = 'no_data_found';
  end if;

  insert into public.auditoria (ator_id, acao, aluno_id)
  values (auth.uid(), 'recusar', registrar_recusa.aluno);
end;
$$;

revoke all on function public.liberar_aluno(uuid, date) from public, anon;
grant execute on function public.liberar_aluno(uuid, date) to authenticated;
revoke all on function public.registrar_recusa(uuid) from public, anon;
grant execute on function public.registrar_recusa(uuid) to authenticated;
