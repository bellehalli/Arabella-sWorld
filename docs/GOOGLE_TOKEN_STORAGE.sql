-- Run only after configuring Supabase authentication and reviewing access policy.
-- This table is deliberately server-only. Never grant browser roles direct access.
create table if not exists public.dreamhub_google_connections (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_tokens jsonb not null,
  scopes text[] not null default '{}',
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.dreamhub_google_connections enable row level security;
revoke all on public.dreamhub_google_connections from anon, authenticated;
-- No client-facing RLS policies. Only trusted server code with validated owner identity
-- and an appropriately scoped service credential may operate on this table.
