alter table public.agents
  add column if not exists is_published boolean not null default true;

create index if not exists agents_is_published_created_at_idx
  on public.agents (is_published, created_at desc);

create table if not exists public.agent_deleted_backups (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid,
  deleted_by uuid,
  agent_snapshot jsonb not null,
  deleted_at timestamptz not null default now()
);

alter table public.agent_deleted_backups enable row level security;

drop policy if exists "Admins can read agent deleted backups" on public.agent_deleted_backups;
create policy "Admins can read agent deleted backups"
  on public.agent_deleted_backups
  for select
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
        and profiles.access_status <> 'blocked'
    )
  );
