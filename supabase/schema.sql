-- Munkanyilvántartó – Supabase séma
-- Másold be a Supabase projekted SQL Editorába, majd nyomd meg a "Run" gombot.
-- Egyszer kell lefuttatni. Létrehozza a `works` táblát és a hozzáférési szabályokat.

-- 1) Tábla: minden munka egy sor, a mezők a `data` JSONB-ben (rugalmas, bővíthető).
create table if not exists public.works (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category    text not null,                 -- 'epiteszet' | 'energetika' | (bármilyen új fül)
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists works_user_cat_idx on public.works (user_id, category);

-- 2) Row Level Security: mindenki KIZÁRÓLAG a saját sorait éri el.
alter table public.works enable row level security;

drop policy if exists "own rows select" on public.works;
drop policy if exists "own rows modify" on public.works;

create policy "own rows select" on public.works
  for select using (auth.uid() = user_id);

create policy "own rows modify" on public.works
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
