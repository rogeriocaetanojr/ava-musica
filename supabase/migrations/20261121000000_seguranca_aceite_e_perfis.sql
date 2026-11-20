-- Segurança do aceite do responsável e dos dados protegidos do perfil
-- (S1, S3 e S8 da auditoria).

-- ---------------------------------------------------------------------------
-- S1: token do aceite só como hash, com validade de 7 dias
-- ---------------------------------------------------------------------------

-- Como no convite do aluno: o site gera o código do link /aceite/<código>,
-- o banco guarda só o SHA-256 dele e a data em que vence. Quem lê a tabela
-- (ou um backup) não consegue montar o link nem dar o aceite no lugar do
-- responsável.
--
-- A coluna antiga, com o token em texto puro, é apagada: os links já
-- enviados deixam de valer. Para o aceite que ainda falta, o professor gera
-- um link novo na ficha do aluno. Os aceites já dados continuam valendo.
alter table public.responsaveis drop column token;

alter table public.responsaveis
  add column token_hash text unique check (token_hash ~ '^[0-9a-f]{64}$'),
  add column expira_em timestamptz;

-- ---------------------------------------------------------------------------
-- S3: idade, faixa de menor e papel só mudam por função
-- ---------------------------------------------------------------------------

-- A política professor_tudo deixa o professor alterar qualquer coluna de
-- perfis pela API. Pôr menor_de_12 = false, por exemplo, pularia o aceite do
-- responsável sem deixar registro. Pela API (anon, authenticated ou chave de
-- serviço), essas colunas não mudam; as funções security definer que gravam
-- a auditoria (liberar_aluno) e os gatilhos do Auth rodam como dono e passam.
-- Na inclusão, o papel só pode ser aluno: apagar o perfil e criar de novo
-- como professor também é barrado.
create function public.dados_protegidos_so_pela_funcao()
returns trigger
language plpgsql
as $$
begin
  if current_user not in ('anon', 'authenticated', 'service_role') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.papel is distinct from 'aluno' then
      raise exception 'o papel só muda direto no banco, nunca pela API'
        using errcode = 'insufficient_privilege';
    end if;
    return new;
  end if;

  if new.papel is distinct from old.papel then
    raise exception 'o papel só muda direto no banco, nunca pela API'
      using errcode = 'insufficient_privilege';
  end if;
  if new.menor_de_12 is distinct from old.menor_de_12
     or new.data_nascimento is distinct from old.data_nascimento then
    raise exception 'a data de nascimento só muda pela função liberar_aluno'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger dados_protegidos_so_pela_funcao
  before insert or update on public.perfis
  for each row execute function public.dados_protegidos_so_pela_funcao();

-- ---------------------------------------------------------------------------
-- S8: um perfil por e-mail, sem diferença de maiúsculas
-- ---------------------------------------------------------------------------

-- Se já houver e-mails repetidos, a migração para aqui e nada é aplicado:
-- resolva os repetidos antes de aplicar de novo.
create unique index perfis_email_unico on public.perfis (lower(email));
