-- PROPOSED MIGRATION ONLY. Do not apply to production without review and backup.
-- The storage bucket is private. All paths begin with the authenticated owner's UUID.
begin;
create table if not exists public.dreamhub_attachments(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.dreamhub_owners(owner_id) on delete cascade,
 record_id text not null check (length(record_id) between 1 and 100),
 name text not null check(length(name) between 1 and 180),
 mime text not null check(mime in ('image/jpeg','image/png','image/webp','image/gif','application/pdf','text/plain','text/markdown')),
 size bigint not null check(size between 0 and 10485760),
 storage_path text not null unique,
 created_at timestamptz not null default now(),
 deleted_at timestamptz,
 constraint owner_path_matches check (storage_path like owner_id::text || '/%')
);
alter table public.dreamhub_attachments enable row level security;
revoke all on public.dreamhub_attachments from anon, authenticated;
grant select, insert, update on public.dreamhub_attachments to authenticated;
create policy "attachment owner select" on public.dreamhub_attachments
 for select to authenticated using(owner_id=(select auth.uid()) and exists(select 1 from public.dreamhub_owners where owner_id=(select auth.uid())));
create policy "attachment owner insert" on public.dreamhub_attachments
 for insert to authenticated with check(owner_id=(select auth.uid()) and exists(select 1 from public.dreamhub_owners where owner_id=(select auth.uid())));
create policy "attachment owner update" on public.dreamhub_attachments
 for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('dreamhub-private','dreamhub-private',false,10485760,ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf','text/plain','text/markdown'])
 on conflict(id) do nothing;
create policy "private file owner read" on storage.objects for select to authenticated
 using(bucket_id='dreamhub-private' and (storage.foldername(name))[1]=(select auth.uid())::text and exists(select 1 from public.dreamhub_owners where owner_id=(select auth.uid())));
create policy "private file owner upload" on storage.objects for insert to authenticated
 with check(bucket_id='dreamhub-private' and (storage.foldername(name))[1]=(select auth.uid())::text and exists(select 1 from public.dreamhub_owners where owner_id=(select auth.uid())));
create policy "private file owner delete" on storage.objects for delete to authenticated
 using(bucket_id='dreamhub-private' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
-- Files are uploaded with authenticated Supabase Storage calls only.
-- Never use public URLs. Use authenticated downloads or short-lived signed URLs.
-- Client deletion must delete the object first, verify success, then mark metadata deleted.
-- The app must prevent orphaned references and support retry after partial failures.
