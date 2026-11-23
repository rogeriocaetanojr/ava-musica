-- Foto de perfil: bucket privado no Storage, um arquivo por pessoa em
-- "<id do perfil>/foto". Só imagem (JPEG, PNG ou WebP) de até 2 MB, conferido
-- pelo próprio Storage. Cada um envia, troca e apaga só a própria foto; o
-- professor também vê as dos alunos (avatares do painel e da turma). Ninguém
-- lê o bucket direto: as telas usam links assinados, gerados no servidor.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fotos-de-perfil',
  'fotos-de-perfil',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- A pasta da foto é o id de quem está logado; o nome do arquivo é fixo.
create policy "foto de perfil: ver a própria, ou o professor vê todas"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'fotos-de-perfil'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.eh_professor())
    )
  );

create policy "foto de perfil: enviar só a própria"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'fotos-de-perfil'
    and name = (select auth.uid())::text || '/foto'
  );

create policy "foto de perfil: trocar só a própria"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'fotos-de-perfil'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'fotos-de-perfil'
    and name = (select auth.uid())::text || '/foto'
  );

create policy "foto de perfil: apagar só a própria"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'fotos-de-perfil'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
