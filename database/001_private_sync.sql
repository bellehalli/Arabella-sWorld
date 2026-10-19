-- Staging migration only. Provision an invited owner through the managed Auth dashboard,
-- then insert that exact auth.users.id into dreamhub_owners as an administrator.
-- Do not enable public signup. This file performs no production migration automatically.
begin;
create table if not exists public.dreamhub_owners (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.dreamhub_owners enable row level security;
revoke all on public.dreamhub_owners from anon, authenticated;
grant select on public.dreamhub_owners to authenticated;
create policy "owner sees own invitation" on public.dreamhub_owners for select to authenticated
 using ((select auth.uid()) = owner_id);
create table if not exists public.dreamhub_state (
 owner_id uuid primary key references public.dreamhub_owners(owner_id) on delete cascade,
 revision bigint not null check (revision > 0),
 payload jsonb not null check (jsonb_typeof(payload) = 'object' and payload ->> 'schema' = '2'),
 updated_at timestamptz not null default now(),
 constraint payload_revision_matches check ((payload ->> 'revision')::bigint = revision),
 constraint bounded_payload check (octet_length(payload::text) <= 10000000)
);
alter table public.dreamhub_state enable row level security;
revoke all on public.dreamhub_state from anon, authenticated;
grant select, insert, update on public.dreamhub_state to authenticated;
create policy "invited owner reads own state" on public.dreamhub_state for select to authenticated
 using (owner_id = (select auth.uid()) and exists(select 1 from public.dreamhub_owners o where o.owner_id=(select auth.uid())));
create policy "invited owner creates own state" on public.dreamhub_state for insert to authenticated
 with check (owner_id = (select auth.uid()) and exists(select 1 from public.dreamhub_owners o where o.owner_id=(select auth.uid())));
create policy "invited owner updates own state" on public.dreamhub_state for update to authenticated
 using (owner_id = (select auth.uid())) with check (owner_id=(select auth.uid()) and exists(select 1 from public.dreamhub_owners o where o.owner_id=(select auth.uid())));
create or replace function public.dreamhub_save(p_expected bigint,p_payload jsonb) returns bigint
 language plpgsql security invoker set search_path = public, pg_temp as $$
declare current_revision bigint; next_revision bigint;
begin
 if auth.uid() is null or not exists(select 1 from public.dreamhub_owners where owner_id=auth.uid()) then raise exception 'NOT_AUTHORIZED'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select revision into current_revision from public.dreamhub_state where owner_id=auth.uid() for update;
 current_revision := coalesce(current_revision,0);
 if current_revision <> p_expected then raise exception 'VERSION_CONFLICT'; end if;
 next_revision := current_revision+1;
 if (p_payload->>'revision')::bigint <> next_revision then raise exception 'INVALID_REVISION'; end if;
 insert into public.dreamhub_state(owner_id,revision,payload) values(auth.uid(),next_revision,p_payload)
 on conflict(owner_id) do update set revision=excluded.revision,payload=excluded.payload,updated_at=now();
 return next_revision;
end; $$;
revoke all on function public.dreamhub_save(bigint,jsonb) from public, anon;
grant execute on function public.dreamhub_save(bigint,jsonb) to authenticated;
commit;
-- Example after manually confirming the owner's managed-auth user ID:
-- insert into public.dreamhub_owners(owner_id) values ('<verified-user-uuid>');
