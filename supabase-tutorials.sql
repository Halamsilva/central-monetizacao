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

alter table public.tutorials enable row level security;

drop policy if exists "Tutoriais publicados visiveis para alunos" on public.tutorials;
create policy "Tutoriais publicados visiveis para alunos"
on public.tutorials
for select
to authenticated
using (is_published = true);

drop policy if exists "Admins gerenciam tutoriais" on public.tutorials;
create policy "Admins gerenciam tutoriais"
on public.tutorials
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create index if not exists tutorials_published_created_at_idx
on public.tutorials (is_published, created_at desc);
