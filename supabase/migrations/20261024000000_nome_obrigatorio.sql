-- Nome sempre preenchido: o e-mail nunca faz as vezes do nome. Quem pede
-- acesso sem nome (pelo código no e-mail, ou pelo Google sem nome) informa o
-- nome antes de o pedido ir ao professor. Até lá, nome fica nulo.

-- ---------------------------------------------------------------------------
-- Coluna
-- ---------------------------------------------------------------------------

alter table public.perfis alter column nome drop not null;

-- Contas em que o gatilho antigo pôs o e-mail no lugar do nome. O pedido
-- pendente sai da lista do professor e volta, com o nome, quando a pessoa o
-- informar; o aviso por e-mail sai de novo, já com o nome.
update public.perfis
set nome = null,
    pedido_em = case when liberado_em is null then null else pedido_em end,
    pedido_avisado_em = case when liberado_em is null then null else pedido_avisado_em end
where lower(btrim(nome)) = lower(btrim(email)) or btrim(nome) = '';

alter table public.perfis add constraint perfis_nome_preenchido
  check (nome is null or (btrim(nome) <> '' and char_length(nome) <= 120));

-- ---------------------------------------------------------------------------
-- Gatilho de perfil
-- ---------------------------------------------------------------------------

-- Igual ao anterior, mas sem cair no e-mail: sem nome nos metadados, o nome
-- fica nulo e a pessoa o informa na tela "Como você se chama?".
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
      nullif(btrim(metadados ->> 'nome'), ''),
      nullif(btrim(metadados ->> 'full_name'), ''),
      nullif(btrim(metadados ->> 'name'), '')
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

-- ---------------------------------------------------------------------------
-- Auditoria: nova ação
-- ---------------------------------------------------------------------------

alter table public.auditoria drop constraint auditoria_acao_check;
alter table public.auditoria add constraint auditoria_acao_check
  check (acao in (
    'abrir', 'editar', 'matricular', 'desmatricular', 'excluir',
    'bloquear', 'desbloquear', 'liberar', 'recusar', 'permitir_pedido',
    'renomear'
  ));

-- ---------------------------------------------------------------------------
-- Nome só pelas funções
-- ---------------------------------------------------------------------------

-- Só as funções abaixo mudam o nome: o professor que alterasse a coluna direto
-- (a política professor_tudo deixaria) pularia a auditoria.
create function public.nome_so_pela_funcao()
returns trigger
language plpgsql
as $$
begin
  if new.nome is distinct from old.nome
     and current_user in ('anon', 'authenticated', 'service_role') then
    raise exception 'o nome só muda pelas funções definir_meu_nome e definir_nome_do_aluno'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger nome_so_pela_funcao
  before update on public.perfis
  for each row execute function public.nome_so_pela_funcao();

-- A própria pessoa informa o nome, uma vez só: depois, só o professor muda.
create function public.definir_meu_nome(p_nome text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  limpo text := btrim(p_nome);
begin
  if auth.uid() is null then
    raise exception 'é preciso estar logado'
      using errcode = 'insufficient_privilege';
  end if;
  if limpo is null or limpo = '' or char_length(limpo) > 120 then
    raise exception 'nome inválido'
      using errcode = 'invalid_parameter_value';
  end if;

  update public.perfis
  set nome = limpo
  where perfis.id = auth.uid() and perfis.nome is null and perfis.bloqueado_em is null;

  if not found then
    raise exception 'o nome já foi informado'
      using errcode = 'no_data_found';
  end if;
end;
$$;

revoke all on function public.definir_meu_nome(text) from public, anon;
grant execute on function public.definir_meu_nome(text) to authenticated;

-- O professor muda o nome do aluno e registra na auditoria, para qualquer
-- idade, na mesma transação.
create function public.definir_nome_do_aluno(aluno uuid, p_nome text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  limpo text := btrim(p_nome);
begin
  if not public.eh_professor() then
    raise exception 'só o professor muda o nome do aluno'
      using errcode = 'insufficient_privilege';
  end if;
  if limpo is null or limpo = '' or char_length(limpo) > 120 then
    raise exception 'nome inválido'
      using errcode = 'invalid_parameter_value';
  end if;

  update public.perfis
  set nome = limpo
  where perfis.id = definir_nome_do_aluno.aluno and perfis.papel = 'aluno';

  if not found then
    raise exception 'aluno não encontrado'
      using errcode = 'no_data_found';
  end if;

  insert into public.auditoria (ator_id, acao, aluno_id)
  values (auth.uid(), 'renomear', definir_nome_do_aluno.aluno);
end;
$$;

revoke all on function public.definir_nome_do_aluno(uuid, text) from public, anon;
grant execute on function public.definir_nome_do_aluno(uuid, text) to authenticated;
