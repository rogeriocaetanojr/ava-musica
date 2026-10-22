-- Esquema inicial do AVA: tabelas, funções auxiliares, RLS e gatilho de perfil.

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  email text not null,
  papel text not null default 'aluno' check (papel in ('professor', 'aluno')),
  data_nascimento date,
  menor_de_12 boolean not null default false,
  criado_em timestamptz not null default now()
);

create table public.responsaveis (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null unique references public.perfis (id) on delete cascade,
  nome text not null,
  email text not null,
  token text not null unique
    default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  aceito_em timestamptz,
  versao_termos text,
  criado_em timestamptz not null default now()
);

create table public.cursos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  instrumento text not null,
  nivel text,
  descricao text,
  capa_url text,
  publicado boolean not null default false,
  criado_em timestamptz not null default now()
);

create table public.modulos (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references public.cursos (id) on delete cascade,
  titulo text not null,
  ordem integer not null default 0
);

create table public.aulas (
  id uuid primary key default gen_random_uuid(),
  modulo_id uuid not null references public.modulos (id) on delete cascade,
  titulo text not null,
  ordem integer not null default 0,
  publicada boolean not null default false
);

create table public.conteudos (
  id uuid primary key default gen_random_uuid(),
  aula_id uuid not null references public.aulas (id) on delete cascade,
  tipo text not null
    check (tipo in ('texto', 'youtube', 'drive', 'audio', 'link', 'prova')),
  ordem integer not null default 0,
  titulo text,
  texto text,
  url text
);

create table public.matriculas (
  aluno_id uuid not null references public.perfis (id) on delete cascade,
  curso_id uuid not null references public.cursos (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (aluno_id, curso_id)
);

-- conteudo_id nulo marca a aula concluída; preenchido marca a prova enviada.
create table public.progresso (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.perfis (id) on delete cascade,
  aula_id uuid not null references public.aulas (id) on delete cascade,
  conteudo_id uuid references public.conteudos (id) on delete cascade,
  concluido_em timestamptz not null default now(),
  unique nulls not distinct (aluno_id, aula_id, conteudo_id)
);

-- curso_id nulo significa aviso para todos os alunos.
create table public.avisos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  texto text not null,
  curso_id uuid references public.cursos (id) on delete cascade,
  publicado_em timestamptz not null default now()
);

create index on public.modulos (curso_id);
create index on public.aulas (modulo_id);
create index on public.conteudos (aula_id);
create index on public.matriculas (curso_id);
create index on public.progresso (aula_id);
create index on public.avisos (curso_id);

-- ---------------------------------------------------------------------------
-- Funções auxiliares (security definer evita recursão entre políticas)
-- ---------------------------------------------------------------------------

create function public.eh_professor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis
    where id = auth.uid() and papel = 'professor'
  );
$$;

-- Aluno com 12 anos ou mais, ou menor com aceite do responsável.
create function public.aluno_liberado()
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
      and (
        not p.menor_de_12
        or exists (
          select 1 from public.responsaveis r
          where r.aluno_id = p.id and r.aceito_em is not null
        )
      )
  );
$$;

-- Curso publicado em que o aluno liberado está matriculado.
create function public.curso_visivel(curso uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.aluno_liberado() and exists (
    select 1
    from public.cursos c
    join public.matriculas m on m.curso_id = c.id
    where c.id = curso and c.publicado and m.aluno_id = auth.uid()
  );
$$;

-- Aula publicada de um curso visível.
create function public.aula_visivel(aula uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.aulas a
    join public.modulos mo on mo.id = a.modulo_id
    where a.id = aula and a.publicada and public.curso_visivel(mo.curso_id)
  );
$$;

-- ---------------------------------------------------------------------------
-- Gatilho: todo usuário novo vira perfil de aluno
-- ---------------------------------------------------------------------------

-- O papel é fixo em 'aluno'; os metadados só fornecem nome e nascimento.
create function public.criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome, email, papel, data_nascimento, menor_de_12)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nome', ''), new.email),
    new.email,
    'aluno',
    (new.raw_user_meta_data ->> 'data_nascimento')::date,
    coalesce((new.raw_user_meta_data ->> 'menor_de_12')::boolean, false)
  );
  return new;
end;
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil();

-- ---------------------------------------------------------------------------
-- Permissões e RLS
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

alter table public.perfis enable row level security;
alter table public.responsaveis enable row level security;
alter table public.cursos enable row level security;
alter table public.modulos enable row level security;
alter table public.aulas enable row level security;
alter table public.conteudos enable row level security;
alter table public.matriculas enable row level security;
alter table public.progresso enable row level security;
alter table public.avisos enable row level security;

-- perfis
-- O professor lê e altera todos os perfis.
create policy professor_tudo on public.perfis for all to authenticated
  using (public.eh_professor()) with check (public.eh_professor());
-- O aluno lê só o próprio perfil e não tem política para alterá-lo.
create policy aluno_le_proprio on public.perfis for select to authenticated
  using (id = auth.uid());

-- responsaveis
-- Só o professor acessa os dados dos responsáveis.
create policy professor_tudo on public.responsaveis for all to authenticated
  using (public.eh_professor()) with check (public.eh_professor());

-- cursos
-- O professor gerencia todos os cursos.
create policy professor_tudo on public.cursos for all to authenticated
  using (public.eh_professor()) with check (public.eh_professor());
-- O aluno lê o curso publicado em que está matriculado.
create policy aluno_le_visivel on public.cursos for select to authenticated
  using (public.curso_visivel(id));

-- modulos
-- O professor gerencia todos os módulos.
create policy professor_tudo on public.modulos for all to authenticated
  using (public.eh_professor()) with check (public.eh_professor());
-- O aluno lê os módulos de um curso visível para ele.
create policy aluno_le_visivel on public.modulos for select to authenticated
  using (public.curso_visivel(curso_id));

-- aulas
-- O professor gerencia todas as aulas.
create policy professor_tudo on public.aulas for all to authenticated
  using (public.eh_professor()) with check (public.eh_professor());
-- O aluno lê a aula publicada de um curso visível.
create policy aluno_le_visivel on public.aulas for select to authenticated
  using (public.aula_visivel(id));

-- conteudos
-- O professor gerencia todos os blocos de conteúdo.
create policy professor_tudo on public.conteudos for all to authenticated
  using (public.eh_professor()) with check (public.eh_professor());
-- O aluno lê os blocos de uma aula visível.
create policy aluno_le_visivel on public.conteudos for select to authenticated
  using (public.aula_visivel(aula_id));

-- matriculas
-- O professor matricula e desmatricula qualquer aluno.
create policy professor_tudo on public.matriculas for all to authenticated
  using (public.eh_professor()) with check (public.eh_professor());
-- O aluno liberado lê as próprias matrículas.
create policy aluno_le_proprias on public.matriculas for select to authenticated
  using (aluno_id = auth.uid() and public.aluno_liberado());

-- progresso
-- O professor lê e corrige o progresso de todos.
create policy professor_tudo on public.progresso for all to authenticated
  using (public.eh_professor()) with check (public.eh_professor());
-- O aluno lê o próprio progresso em aulas visíveis.
create policy aluno_le_proprio on public.progresso for select to authenticated
  using (aluno_id = auth.uid() and public.aula_visivel(aula_id));
-- O aluno registra progresso só para si, em aula visível e com conteúdo da mesma aula.
create policy aluno_grava_proprio on public.progresso for insert to authenticated
  with check (
    aluno_id = auth.uid()
    and public.aula_visivel(aula_id)
    and (
      conteudo_id is null
      or exists (
        select 1 from public.conteudos c
        where c.id = conteudo_id and c.aula_id = progresso.aula_id
      )
    )
  );
-- O aluno desfaz só o próprio progresso em aula visível.
create policy aluno_apaga_proprio on public.progresso for delete to authenticated
  using (aluno_id = auth.uid() and public.aula_visivel(aula_id));

-- avisos
-- O professor publica, edita e apaga avisos.
create policy professor_tudo on public.avisos for all to authenticated
  using (public.eh_professor()) with check (public.eh_professor());
-- O aluno liberado lê avisos já publicados, gerais ou de cursos visíveis.
create policy aluno_le_visivel on public.avisos for select to authenticated
  using (
    public.aluno_liberado()
    and publicado_em <= now()
    and (curso_id is null or public.curso_visivel(curso_id))
  );
