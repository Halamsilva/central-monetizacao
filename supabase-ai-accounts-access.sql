alter table public.profiles
  add column if not exists ai_accounts_access boolean not null default false;

create index if not exists profiles_ai_accounts_access_idx
  on public.profiles (ai_accounts_access);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;
