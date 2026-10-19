-- NG Studio: reparar as políticas do bucket privado ng-anexos.
-- Execute uma vez no SQL Editor do projeto NG Studio no Supabase.
-- Preserva as OS, imagens existentes, clientes e a autenticação.
-- Esta migração NÃO torna o bucket público.
begin;

-- Corrige configurações do bucket existente ou cria-o caso esteja ausente.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('ng-anexos','ng-anexos',false,12582912,ARRAY['image/png','image/jpeg','image/webp'])
on conflict(id) do update set
  public=false,
  file_size_limit=12582912,
  allowed_mime_types=ARRAY['image/png','image/jpeg','image/webp'];

-- Reconstrói APENAS as políticas específicas do NG Studio.
drop policy if exists "ng_storage_read" on storage.objects;
drop policy if exists "ng_storage_upload" on storage.objects;
drop policy if exists "ng_storage_delete" on storage.objects;

create policy "ng_storage_read"
on storage.objects
for select to authenticated
using (
  bucket_id='ng-anexos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "ng_storage_upload"
on storage.objects
for insert to authenticated
with check (
  bucket_id='ng-anexos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "ng_storage_delete"
on storage.objects
for delete to authenticated
using (
  bucket_id='ng-anexos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

commit;

-- Confirmação: as três políticas devem aparecer nesta consulta.
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname='storage' and tablename='objects'
  and policyname in ('ng_storage_read','ng_storage_upload','ng_storage_delete')
order by policyname;

-- Confirmação: bucket privado.
select id, public, file_size_limit, allowed_mime_types
from storage.buckets where id='ng-anexos';
