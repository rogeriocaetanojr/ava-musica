-- Limite de convites por hora e registro de acessos aos dados de menores.

-- ---------------------------------------------------------------------------
-- Envios de convite (limite de 20 por hora para o professor)
-- ---------------------------------------------------------------------------

create table public.envios_convite (
  id bigint generated always as identity primary key,
  professor_id uuid not null default auth.uid(),
  criado_em timestamptz not null default now()
);

create index on public.envios_convite (professor_id, criado_em);

create function public.convites_na_ultima_hora()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.envios_convite
  where professor_id = auth.uid()
    and criado_em > now() - interval '1 hour';
$$;

revoke all on public.envios_convite from anon, authenticated;
grant select, insert on public.envios_convite to authenticated;
alter table public.envios_convite enable row level security;

create policy professor_le_proprios on public.envios_convite
  for select to authenticated
  using (public.eh_professor() and professor_id = auth.uid());
-- O banco recusa o 21º envio na mesma hora, mesmo que a tela não confira.
create policy professor_registra_ate_o_limite on public.envios_convite
  for insert to authenticated
  with check (
    public.eh_professor()
    and professor_id = auth.uid()
    and public.convites_na_ultima_hora() < 20
  );

-- ---------------------------------------------------------------------------
-- Auditoria (só inclusão; guarda o id do aluno, sem nome nem e-mail, para o
-- registro continuar válido depois que o aluno for excluído)
-- ---------------------------------------------------------------------------

create table public.auditoria (
  id bigint generated always as identity primary key,
  ator_id uuid not null,
  acao text not null
    check (acao in ('abrir', 'editar', 'matricular', 'desmatricular', 'excluir')),
  aluno_id uuid not null,
  criado_em timestamptz not null default now()
);

create index on public.auditoria (aluno_id, criado_em desc);

-- Ninguém altera nem apaga um registro, nem com a chave de serviço.
create function public.auditoria_imutavel()
returns trigger
language plpgsql
as $$
begin
  raise exception 'registros da auditoria não podem ser alterados nem apagados'
    using errcode = 'insufficient_privilege';
end;
$$;

create trigger auditoria_imutavel
  before update or delete on public.auditoria
  for each row execute function public.auditoria_imutavel();

create trigger auditoria_sem_truncate
  before truncate on public.auditoria
  for each statement execute function public.auditoria_imutavel();

-- Grava o acesso do professor a um aluno menor de 18 anos. A idade é
-- conferida aqui, no horário de Brasília; maiores de 18 não geram registro.
-- Sem data de nascimento, registra por precaução.
create function public.registrar_acesso(acao text, aluno uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if not public.eh_professor() then
    raise exception 'só o professor registra acessos'
      using errcode = 'insufficient_privilege';
  end if;

  insert into public.auditoria (ator_id, acao, aluno_id)
  select auth.uid(), registrar_acesso.acao, p.id
  from public.perfis p
  where p.id = registrar_acesso.aluno
    and p.papel = 'aluno'
    and (p.data_nascimento is null or p.data_nascimento > hoje - interval '18 years');
end;
$$;

revoke all on function public.registrar_acesso(text, uuid) from public, anon;
grant execute on function public.registrar_acesso(text, uuid) to authenticated;

-- A aplicação só lê; a inclusão passa pela função acima.
revoke all on public.auditoria from anon, authenticated;
grant select on public.auditoria to authenticated;
alter table public.auditoria enable row level security;

create policy professor_le on public.auditoria for select to authenticated
  using (public.eh_professor());
