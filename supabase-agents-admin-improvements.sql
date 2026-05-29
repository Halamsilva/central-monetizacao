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

create table if not exists public.agent_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  agent_id uuid,
  event_type text not null check (event_type in ('open', 'copy_prompt', 'favorite')),
  created_at timestamptz not null default now()
);

create index if not exists agent_usage_events_agent_created_idx
  on public.agent_usage_events (agent_id, created_at desc);

create index if not exists agent_usage_events_user_created_idx
  on public.agent_usage_events (user_id, created_at desc);

alter table public.agent_usage_events enable row level security;

drop policy if exists "Users can create own agent usage events" on public.agent_usage_events;
create policy "Users can create own agent usage events"
  on public.agent_usage_events
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Admins can read agent usage events" on public.agent_usage_events;
create policy "Admins can read agent usage events"
  on public.agent_usage_events
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
