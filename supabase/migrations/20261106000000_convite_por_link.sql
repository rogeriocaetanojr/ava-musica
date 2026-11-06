-- Convite por link: o professor cadastra o aluno, o site manda por e-mail o
-- link /convite/<código> e o aluno define a senha no primeiro acesso.
--
-- Só o hash (sha256) do código fica no banco. O link vale 7 dias e uma vez
-- só; cada aluno tem no máximo um convite, e gerar outro troca a linha, o
-- que invalida o anterior. Quem resgata o link ainda não tem sessão, então o
-- resgate é feito no servidor com a chave de serviço; pela API, só o
-- professor lê e grava.

create table public.convites (
  aluno_id uuid primary key references public.perfis (id) on delete cascade,
  codigo_hash text not null unique check (codigo_hash ~ '^[0-9a-f]{64}$'),
  expira_em timestamptz not null default now() + interval '7 days',
  usado_em timestamptz,
  criado_em timestamptz not null default now()
);

revoke all on public.convites from anon, authenticated;
grant select, insert, update, delete on public.convites to authenticated;
alter table public.convites enable row level security;

create policy professor_tudo on public.convites for all to authenticated
  using (public.eh_professor()) with check (public.eh_professor());
