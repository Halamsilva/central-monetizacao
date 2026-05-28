create extension if not exists pgcrypto;

create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null,
  status text not null default 'pending',
  prompt text not null,
  model text not null,
  result_url text,
  metadata jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.generation_jobs
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.generation_jobs enable row level security;

create index if not exists generation_jobs_type_status_idx
  on public.generation_jobs (type, status, created_at desc);

create index if not exists generation_jobs_user_created_idx
  on public.generation_jobs (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists generation_jobs_set_updated_at on public.generation_jobs;
create trigger generation_jobs_set_updated_at
before update on public.generation_jobs
for each row execute function public.set_updated_at();

drop policy if exists generation_jobs_select_own on public.generation_jobs;
create policy generation_jobs_select_own
on public.generation_jobs for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists generation_jobs_insert_own on public.generation_jobs;
create policy generation_jobs_insert_own
on public.generation_jobs for insert
to authenticated
with check (auth.uid() = user_id and type = 'video');

drop policy if exists generation_jobs_delete_own_pending_failed on public.generation_jobs;
create policy generation_jobs_delete_own_pending_failed
on public.generation_jobs for delete
to authenticated
using (auth.uid() = user_id and status in ('pending', 'failed'));

create table if not exists public.generation_worker_status (
  id text primary key,
  status text not null default 'offline',
  message text,
  flow_project_url text,
  current_job_id uuid,
  online_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.generation_worker_status enable row level security;

drop policy if exists generation_worker_status_read on public.generation_worker_status;
create policy generation_worker_status_read
on public.generation_worker_status for select
to authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('flow-results', 'flow-results', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists flow_results_public_read on storage.objects;
create policy flow_results_public_read
on storage.objects for select
using (bucket_id = 'flow-results');
