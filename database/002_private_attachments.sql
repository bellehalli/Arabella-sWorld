-- STAGING ONLY. Apply after 001_private_sync.sql to the isolated staging project.
-- This creates a private storage bucket and owner-scoped metadata. It never targets production.
begin;

create table if not exists public.dreamhub_attachments (
  id uuid primary key,
  owner_id uuid not null references public.dreamhub_owners(owner_id) on delete cascade,
  record_id text not null check (length(record_id) between 1 and 128),
  file_name text not null check (length(file_name) between 1 and 180),
  mime_type text not null check (mime_type in (
    'application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )),
  byte_size bigint not null check (byte_size between 1 and 15728640),
  storage_path text not null unique,
  created_at timestamptz not null default now(),
  constraint attachment_path_is_owner_scoped check (split_part(storage_path, '/', 1) = owner_id::text),
  constraint attachment_path_has_one_file check (storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](pdf|jpg|jpeg|png|webp|txt|docx)$')
);

alter table public.dreamhub_attachments enable row level security;
revoke all on public.dreamhub_attachments from public, anon, authenticated;
grant select, insert, delete on public.dreamhub_attachments to authenticated;

drop policy if exists "invited owner reads own attachments" on public.dreamhub_attachments;
create policy "invited owner reads own attachments" on public.dreamhub_attachments
  for select to authenticated
  using (owner_id = (select auth.uid()) and exists (
    select 1 from public.dreamhub_owners o where o.owner_id = (select auth.uid())
  ));

drop policy if exists "invited owner creates own attachments" on public.dreamhub_attachments;
create policy "invited owner creates own attachments" on public.dreamhub_attachments
  for insert to authenticated
  with check (owner_id = (select auth.uid())
    and split_part(storage_path, '/', 1) = (select auth.uid())::text
    and exists (select 1 from public.dreamhub_owners o where o.owner_id = (select auth.uid())));

drop policy if exists "invited owner deletes own attachments" on public.dreamhub_attachments;
create policy "invited owner deletes own attachments" on public.dreamhub_attachments
  for delete to authenticated
  using (owner_id = (select auth.uid()) and exists (
    select 1 from public.dreamhub_owners o where o.owner_id = (select auth.uid())
  ));

create or replace function public.limit_dreamhub_attachments_per_record()
returns trigger language plpgsql security invoker set search_path = public, pg_temp as $$
begin
  if auth.uid() is null or new.owner_id is distinct from auth.uid() then
    raise exception 'NOT_AUTHORIZED';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || ':' || new.record_id, 0));
  if (select count(*) from public.dreamhub_attachments a
      where a.owner_id = auth.uid() and a.record_id = new.record_id) >= 10 then
    raise exception 'ATTACHMENT_LIMIT';
  end if;
  return new;
end; $$;

revoke all on function public.limit_dreamhub_attachments_per_record() from public, anon, authenticated;
grant execute on function public.limit_dreamhub_attachments_per_record() to authenticated;
drop trigger if exists dreamhub_attachment_record_limit on public.dreamhub_attachments;
create trigger dreamhub_attachment_record_limit
  before insert on public.dreamhub_attachments
  for each row execute function public.limit_dreamhub_attachments_per_record();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dreamhub-attachments', 'dreamhub-attachments', false, 15728640, array[
  'application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
])
on conflict (id) do update set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "invited owner uploads own attachments" on storage.objects;
create policy "invited owner uploads own attachments" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'dreamhub-attachments'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and exists (select 1 from public.dreamhub_owners o where o.owner_id = (select auth.uid())));

drop policy if exists "invited owner reads own attachment files" on storage.objects;
create policy "invited owner reads own attachment files" on storage.objects
  for select to authenticated
  using (bucket_id = 'dreamhub-attachments'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and exists (select 1 from public.dreamhub_owners o where o.owner_id = (select auth.uid()))
    and exists (select 1 from public.dreamhub_attachments a
      where a.owner_id = (select auth.uid()) and a.storage_path = name));

drop policy if exists "invited owner deletes own attachment files" on storage.objects;
create policy "invited owner deletes own attachment files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'dreamhub-attachments'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and exists (select 1 from public.dreamhub_owners o where o.owner_id = (select auth.uid())));

commit;
