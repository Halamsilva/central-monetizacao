-- Execute este SQL no Supabase para ativar a liberação automática via Kiwify.

create table if not exists public.kiwify_purchases (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  kiwify_order_id text,
  product_id text,
  purchase_status text not null default 'pending'
    check (purchase_status in ('pending', 'active', 'blocked')),
  paid_at timestamptz,
  release_at timestamptz not null,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists kiwify_purchases_email_key
  on public.kiwify_purchases (email);

alter table public.kiwify_purchases enable row level security;

drop policy if exists "Admins can read kiwify purchases" on public.kiwify_purchases;
create policy "Admins can read kiwify purchases"
  on public.kiwify_purchases
  for select
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );
