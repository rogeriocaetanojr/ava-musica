-- Pedido de acesso também pelo e-mail (link mágico com cadastro aberto) e
-- bloqueio de 7 dias para quem foi recusado. O pedido só conta depois que a
-- pessoa confirma o e-mail (clica no link ou volta do Google): sem isso,
-- qualquer um encheria a lista do professor com e-mails de terceiros.

-- Hora em que a pessoa confirmou o pedido. O professor só vê pedidos com essa
-- marca; a conta criada e nunca confirmada não aparece nem gera aviso.
alter table public.perfis add column pedido_em timestamptz;

-- Os pendentes que já existem entraram pelo Google, então já confirmaram.
update public.perfis set pedido_em = criado_em where liberado_em is null;

-- ---------------------------------------------------------------------------
-- Recusas recentes
-- ---------------------------------------------------------------------------

-- O schema privado não é exposto pela API nem tem permissão para ninguém além
-- do dono: só as funções abaixo (security definer) leem e gravam.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create schema privado;
revoke all on schema privado from public;

-- Chave do HMAC do e-mail, gerada aqui e nunca exposta. Um SHA-256 simples de
-- e-mail se descobre testando listas de e-mails conhecidos; com a chave, não.
create table privado.chave_recusas (
  unica boolean primary key default true check (unica),
  chave bytea not null
);
insert into privado.chave_recusas (chave) values (extensions.gen_random_bytes(32));

-- Guarda só o hash do e-mail, a dica mascarada para o professor reconhecer a
-- pessoa (a***@g***.com) e o id da conta apagada (o mesmo da auditoria).
-- Tudo é apagado depois de 7 dias.
create table privado.recusas_recentes (
  email_hash text primary key,
  aluno_id uuid not null unique,
  dica text not null,
  recusado_em timestamptz not null default now()
);

revoke all on all tables in schema privado from public, anon, authenticated, service_role;

create function privado.hash_do_email(email text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select encode(
    extensions.hmac(
      convert_to(lower(btrim(hash_do_email.email)), 'UTF8'),
      (select chave from privado.chave_recusas),
      'sha256'
    ),
    'hex'
  );
$$;

-- a***@g***.com: a primeira letra do nome, a primeira letra do domínio e só a
-- última parte dele (não revela a instituição em aluno@escola.sp.gov.br).
create function privado.mascarar_email(email text)
returns text
language sql
immutable
set search_path = ''
as $$
  select left(split_part(e, '@', 1), 1) || '***@'
      || left(split_part(e, '@', 2), 1) || '***'
      || case
           when position('.' in split_part(e, '@', 2)) > 0
             then '.' || reverse(split_part(reverse(split_part(e, '@', 2)), '.', 1))
           else ''
         end
  from (select lower(btrim(mascarar_email.email)) as e) as normalizado;
$$;

create function privado.apagar_recusas_vencidas()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from privado.recusas_recentes
  where recusado_em < now() - interval '7 days';
$$;

revoke all on all functions in schema privado from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Auditoria: nova ação
-- ---------------------------------------------------------------------------

alter table public.auditoria drop constraint auditoria_acao_check;
alter table public.auditoria add constraint auditoria_acao_check
  check (acao in (
    'abrir', 'editar', 'matricular', 'desmatricular', 'excluir',
    'bloquear', 'desbloquear', 'liberar', 'recusar', 'permitir_pedido'
  ));

-- ---------------------------------------------------------------------------
-- Recusa
-- ---------------------------------------------------------------------------

-- Agora também guarda a recusa por 7 dias, na mesma transação da auditoria.
-- Recusar de novo o mesmo e-mail renova o prazo.
create or replace function public.registrar_recusa(aluno uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  email_do_aluno text;
begin
  if not public.eh_professor() then
    raise exception 'só o professor recusa pedidos'
      using errcode = 'insufficient_privilege';
  end if;

  select email into email_do_aluno
  from public.perfis
  where id = registrar_recusa.aluno and papel = 'aluno' and liberado_em is null;

  if not found then
    raise exception 'pedido pendente não encontrado'
      using errcode = 'no_data_found';
  end if;

  insert into public.auditoria (ator_id, acao, aluno_id)
  values (auth.uid(), 'recusar', registrar_recusa.aluno);

  perform privado.apagar_recusas_vencidas();
  insert into privado.recusas_recentes (email_hash, aluno_id, dica)
  values (
    privado.hash_do_email(email_do_aluno),
    registrar_recusa.aluno,
    privado.mascarar_email(email_do_aluno)
  )
  on conflict (email_hash) do update
    set aluno_id = excluded.aluno_id,
        dica = excluded.dica,
        recusado_em = now();
end;
$$;

-- Lista para o painel do professor, sem as vencidas.
create function public.listar_recusas_recentes()
returns table (aluno_id uuid, dica text, recusado_em timestamptz, vale_ate timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.eh_professor() then
    raise exception 'só o professor vê as recusas'
      using errcode = 'insufficient_privilege';
  end if;

  return query
    select r.aluno_id, r.dica, r.recusado_em, r.recusado_em + interval '7 days'
    from privado.recusas_recentes r
    where r.recusado_em >= now() - interval '7 days'
    order by r.recusado_em desc;
end;
$$;

-- Apaga a recusa escolhida na lista e registra na auditoria, com o id da
-- conta recusada.
create function public.permitir_novo_pedido(aluno uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.eh_professor() then
    raise exception 'só o professor permite novos pedidos'
      using errcode = 'insufficient_privilege';
  end if;

  delete from privado.recusas_recentes where aluno_id = permitir_novo_pedido.aluno;

  if not found then
    raise exception 'recusa não encontrada'
      using errcode = 'no_data_found';
  end if;

  insert into public.auditoria (ator_id, acao, aluno_id)
  values (auth.uid(), 'permitir_pedido', permitir_novo_pedido.aluno);
end;
$$;

-- O mesmo, pelo e-mail digitado pelo professor (e pelo cadastro do aluno, que
-- sempre passa por cima da recusa). Devolve se havia recusa para o e-mail.
create function public.permitir_novo_pedido_por_email(email text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  recusado uuid;
begin
  if not public.eh_professor() then
    raise exception 'só o professor permite novos pedidos'
      using errcode = 'insufficient_privilege';
  end if;

  delete from privado.recusas_recentes
  where email_hash = privado.hash_do_email(permitir_novo_pedido_por_email.email)
  returning aluno_id into recusado;

  if recusado is null then
    return false;
  end if;

  insert into public.auditoria (ator_id, acao, aluno_id)
  values (auth.uid(), 'permitir_pedido', recusado);
  return true;
end;
$$;

revoke all on function public.listar_recusas_recentes() from public, anon;
grant execute on function public.listar_recusas_recentes() to authenticated;
revoke all on function public.permitir_novo_pedido(uuid) from public, anon;
grant execute on function public.permitir_novo_pedido(uuid) to authenticated;
revoke all on function public.permitir_novo_pedido_por_email(text) from public, anon;
grant execute on function public.permitir_novo_pedido_por_email(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Hook "Before User Created" do Supabase Auth
-- ---------------------------------------------------------------------------

-- Chamado pelo Auth antes de criar qualquer conta (link mágico, Google e
-- cadastro pelo admin). Recusa o e-mail recusado há menos de 7 dias. A
-- mensagem é neutra: a tela não revela a terceiros que houve recusa.
create function public.antes_de_criar_usuario(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform privado.apagar_recusas_vencidas();

  if exists (
    select 1 from privado.recusas_recentes
    where email_hash = privado.hash_do_email(event -> 'user' ->> 'email')
  ) then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Não foi possível pedir acesso agora.'
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

revoke all on function public.antes_de_criar_usuario(jsonb) from public, anon, authenticated, service_role;
grant execute on function public.antes_de_criar_usuario(jsonb) to supabase_auth_admin;
