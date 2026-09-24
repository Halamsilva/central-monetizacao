-- Bootstrap completo para um novo projeto Supabase Free da Central Monetizacao.
-- Rode este arquivo no SQL Editor do Supabase novo.
-- Depois atualize as variaveis da Vercel:
-- VITE_SUPABASE_URL, SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and coalesce(access_status, 'pending') <> 'blocked'
  );
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  avatar_url text,
  is_admin boolean not null default false,
  role text not null default 'student' check (role in ('admin', 'student')),
  access_status text not null default 'pending' check (access_status in ('pending', 'active', 'blocked')),
  ai_accounts_access boolean not null default false,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_email_key on public.profiles (lower(email));
create index if not exists profiles_access_status_idx on public.profiles (access_status);
create index if not exists profiles_ai_accounts_access_idx on public.profiles (ai_accounts_access);

alter table public.profiles enable row level security;

drop policy if exists profiles_read_own_or_admin on public.profiles;
create policy profiles_read_own_or_admin on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert to authenticated
with check (id = auth.uid());

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin on public.profiles
for update to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  image text not null default '',
  category text not null default 'Geral',
  agent_link text not null default '',
  prompt text not null default '',
  tag text not null default 'NOVO',
  featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agents_is_published_created_at_idx on public.agents (is_published, created_at desc);
create index if not exists agents_featured_created_at_idx on public.agents (featured, created_at desc);

alter table public.agents enable row level security;

drop policy if exists agents_read_published_or_admin on public.agents;
create policy agents_read_published_or_admin on public.agents
for select to authenticated
using (is_published = true or public.is_admin());

drop policy if exists agents_admin_manage on public.agents;
create policy agents_admin_manage on public.agents
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop trigger if exists agents_set_updated_at on public.agents;
create trigger agents_set_updated_at
before update on public.agents
for each row execute function public.set_updated_at();

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null default '',
  thumbnail_url text,
  banner_url text,
  is_pinned boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

drop policy if exists announcements_read_published_or_admin on public.announcements;
create policy announcements_read_published_or_admin on public.announcements
for select to authenticated
using (is_published = true or public.is_admin());

drop policy if exists announcements_admin_manage on public.announcements;
create policy announcements_admin_manage on public.announcements
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null default '',
  type text not null default 'info',
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists notifications_read_authenticated on public.notifications;
create policy notifications_read_authenticated on public.notifications
for select to authenticated
using (true);

drop policy if exists notifications_admin_manage on public.notifications;
create policy notifications_admin_manage on public.notifications
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create table if not exists public.downloads_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  type text not null default 'Outros',
  external_link text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.facebook_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null default 'Estrategia',
  intent text not null default '',
  description text not null default '',
  content text not null default '',
  external_link text,
  image text,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tiktok_shop_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null default 'Estrategia',
  intent text not null default '',
  description text not null default '',
  content text not null default '',
  external_link text,
  image text,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.youtube_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null default 'Estrategia',
  intent text not null default '',
  description text not null default '',
  content text not null default '',
  external_link text,
  image text,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.viral_prompts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Prompts Virais',
  content text not null default '',
  is_featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.shop_products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  price text not null default '',
  image_url text,
  checkout_url text not null default '',
  button_text text not null default 'QUER COMPRAR',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.tutorials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  video_url text not null,
  category text not null default 'Tutorial',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kiwify_purchases (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  kiwify_order_id text,
  product_id text,
  purchase_status text not null default 'pending' check (purchase_status in ('pending', 'active', 'blocked')),
  paid_at timestamptz,
  release_at timestamptz not null,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists kiwify_purchases_email_key on public.kiwify_purchases (lower(email));

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_deleted_backups (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid,
  deleted_by uuid,
  agent_snapshot jsonb not null,
  deleted_at timestamptz not null default now()
);

create table if not exists public.agent_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  agent_id uuid,
  event_type text not null check (event_type in ('open', 'copy_prompt', 'favorite')),
  created_at timestamptz not null default now()
);

do $$
declare
  t text;
begin
  foreach t in array array[
    'downloads_items',
    'facebook_items',
    'tiktok_shop_items',
    'youtube_items',
    'viral_prompts',
    'shop_products',
    'tutorials',
    'kiwify_purchases',
    'app_settings',
    'agent_deleted_backups',
    'agent_usage_events'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

drop policy if exists downloads_items_read on public.downloads_items;
create policy downloads_items_read on public.downloads_items for select to authenticated using (true);
drop policy if exists downloads_items_admin_manage on public.downloads_items;
create policy downloads_items_admin_manage on public.downloads_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

do $$
declare
  t text;
begin
  foreach t in array array['facebook_items', 'tiktok_shop_items', 'youtube_items', 'viral_prompts']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_read', t);
    execute format('create policy %I on public.%I for select to authenticated using (is_published = true or public.is_admin())', t || '_read', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_manage', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t || '_admin_manage', t);
  end loop;
end $$;

drop policy if exists shop_products_read on public.shop_products;
create policy shop_products_read on public.shop_products for select to authenticated using (is_active = true or public.is_admin());
drop policy if exists shop_products_admin_manage on public.shop_products;
create policy shop_products_admin_manage on public.shop_products for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists tutorials_read on public.tutorials;
create policy tutorials_read on public.tutorials for select to authenticated using (is_published = true or public.is_admin());
drop policy if exists tutorials_admin_manage on public.tutorials;
create policy tutorials_admin_manage on public.tutorials for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists kiwify_purchases_admin_read on public.kiwify_purchases;
create policy kiwify_purchases_admin_read on public.kiwify_purchases for select to authenticated using (public.is_admin());

drop policy if exists app_settings_admin_manage on public.app_settings;
create policy app_settings_admin_manage on public.app_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists agent_deleted_backups_admin_read on public.agent_deleted_backups;
create policy agent_deleted_backups_admin_read on public.agent_deleted_backups for select to authenticated using (public.is_admin());

drop policy if exists agent_usage_events_insert_own on public.agent_usage_events;
create policy agent_usage_events_insert_own on public.agent_usage_events for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists agent_usage_events_admin_read on public.agent_usage_events;
create policy agent_usage_events_admin_read on public.agent_usage_events for select to authenticated using (public.is_admin());

-- Buckets leves. Evite MP4 aqui; use YouTube para videos.
insert into storage.buckets (id, name, public)
values
  ('agent-images', 'agent-images', true),
  ('announcements', 'announcements', true),
  ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists public_read_light_assets on storage.objects;
create policy public_read_light_assets on storage.objects for select
using (bucket_id in ('agent-images', 'announcements', 'avatars'));

drop policy if exists authenticated_upload_light_assets on storage.objects;
create policy authenticated_upload_light_assets on storage.objects for insert
to authenticated
with check (bucket_id in ('agent-images', 'announcements', 'avatars'));
