-- ============================================================================
-- Estudio de Videos IA - tabelas necessarias
-- Rode este script no painel do Supabase: SQL Editor > New query > Run
-- ============================================================================

-- 1) Chave de video individual de cada aluno (protegida por RLS)
create table if not exists public.user_video_keys (
  id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'magichour',
  api_key text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_video_keys enable row level security;

drop policy if exists "user_video_keys_select_own" on public.user_video_keys;
create policy "user_video_keys_select_own"
  on public.user_video_keys for select
  using (auth.uid() = id);

drop policy if exists "user_video_keys_insert_own" on public.user_video_keys;
create policy "user_video_keys_insert_own"
  on public.user_video_keys for insert
  with check (auth.uid() = id);

drop policy if exists "user_video_keys_update_own" on public.user_video_keys;
create policy "user_video_keys_update_own"
  on public.user_video_keys for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "user_video_keys_delete_own" on public.user_video_keys;
create policy "user_video_keys_delete_own"
  on public.user_video_keys for delete
  using (auth.uid() = id);

-- 2) Historico de geracoes (cada aluno ve somente as suas)
create table if not exists public.video_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'magichour',
  provider_job_id text,
  model text,
  prompt text,
  aspect_ratio text,
  resolution text,
  duration_seconds numeric,
  status text not null default 'queued',
  video_url text,
  credits_charged integer,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists video_generations_user_created_idx
  on public.video_generations (user_id, created_at desc);

alter table public.video_generations enable row level security;

drop policy if exists "video_generations_select_own" on public.video_generations;
create policy "video_generations_select_own"
  on public.video_generations for select
  using (auth.uid() = user_id);

drop policy if exists "video_generations_insert_own" on public.video_generations;
create policy "video_generations_insert_own"
  on public.video_generations for insert
  with check (auth.uid() = user_id);

drop policy if exists "video_generations_update_own" on public.video_generations;
create policy "video_generations_update_own"
  on public.video_generations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "video_generations_delete_own" on public.video_generations;
create policy "video_generations_delete_own"
  on public.video_generations for delete
  using (auth.uid() = user_id);
