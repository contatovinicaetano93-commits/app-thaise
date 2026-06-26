-- Storage para anexos do checklist (fases A–F)
-- Rode no SQL Editor após migration_rls_by_role.sql

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'checklist-evidence',
  'checklist-evidence',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Gestor: upload e leitura em projects/*
drop policy if exists "gestor checklist upload" on storage.objects;
drop policy if exists "gestor checklist read" on storage.objects;
drop policy if exists "gestor checklist update" on storage.objects;
drop policy if exists "gestor checklist delete" on storage.objects;
drop policy if exists "authenticated checklist read" on storage.objects;

create policy "gestor checklist upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'checklist-evidence'
    and (storage.foldername(name))[1] = 'projects'
    and exists (
      select 1 from profiles
      where id = auth.uid() and role = 'gestor'
    )
  );

create policy "gestor checklist update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'checklist-evidence'
    and exists (select 1 from profiles where id = auth.uid() and role = 'gestor')
  );

create policy "gestor checklist delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'checklist-evidence'
    and exists (select 1 from profiles where id = auth.uid() and role = 'gestor')
  );

create policy "authenticated checklist read" on storage.objects
  for select to authenticated
  using (bucket_id = 'checklist-evidence');
