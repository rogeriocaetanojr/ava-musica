-- Bloqueio do acesso do aluno pelo professor. Os dados e o progresso ficam
-- guardados; só o acesso é cortado.

alter table public.perfis add column bloqueado_em timestamptz;

-- Aluno com 12 anos ou mais, ou menor com aceite do responsável, e não
-- bloqueado. Toda a RLS do aluno passa por aqui, então o bloqueio vale na
-- hora, mesmo com a sessão ainda aberta.
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
    'bloquear', 'desbloquear'
  ));

-- ---------------------------------------------------------------------------
-- Bloqueio
-- ---------------------------------------------------------------------------

-- Só esta função muda bloqueado_em: o professor que alterasse a coluna direto
-- (a política professor_tudo deixaria) pularia a auditoria.
create function public.bloqueio_so_pela_funcao()
returns trigger
language plpgsql
as $$
begin
  if new.bloqueado_em is distinct from old.bloqueado_em
     and current_user in ('anon', 'authenticated', 'service_role') then
    raise exception 'o bloqueio só muda pela função definir_bloqueio'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger bloqueio_so_pela_funcao
  before update on public.perfis
  for each row execute function public.bloqueio_so_pela_funcao();

-- Bloqueia ou desbloqueia o aluno e registra a ação na auditoria, na mesma
-- transação. Diferente de registrar_acesso, registra para qualquer idade.
-- Repetir a ação não muda a data do bloqueio, mas registra de novo.
create function public.definir_bloqueio(aluno uuid, bloquear boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.eh_professor() then
    raise exception 'só o professor bloqueia alunos'
      using errcode = 'insufficient_privilege';
  end if;

  update public.perfis
  set bloqueado_em = case
    when definir_bloqueio.bloquear then coalesce(bloqueado_em, now())
    else null
  end
  where id = definir_bloqueio.aluno and papel = 'aluno';

  if not found then
    raise exception 'aluno não encontrado'
      using errcode = 'no_data_found';
  end if;

  insert into public.auditoria (ator_id, acao, aluno_id)
  values (
    auth.uid(),
    case when definir_bloqueio.bloquear then 'bloquear' else 'desbloquear' end,
    definir_bloqueio.aluno
  );
end;
$$;

revoke all on function public.definir_bloqueio(uuid, boolean) from public, anon;
grant execute on function public.definir_bloqueio(uuid, boolean) to authenticated;
