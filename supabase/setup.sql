-- Batch OS — one-time Supabase setup.
--
-- Paste the whole file into the Supabase SQL Editor and run it. It is safe to
-- run more than once. Keep this in step with SETUP_SQL in lib/os/cloud.ts,
-- which is what the app shows on screen.
--
-- One row per person, holding the sealed vault exactly as it sits on the
-- device. The database never sees anything readable, and the policies below
-- stop one account from reaching another's row.

create table if not exists public.vaults (
  user_id    uuid primary key references auth.users on delete cascade,
  sealed     jsonb not null,
  updated_at bigint not null,
  modified   timestamptz not null default now()
);

alter table public.vaults enable row level security;

grant select, insert, update on public.vaults to authenticated;

drop policy if exists "own vault read"   on public.vaults;
drop policy if exists "own vault insert" on public.vaults;
drop policy if exists "own vault update" on public.vaults;

create policy "own vault read"
  on public.vaults for select
  to authenticated
  using (auth.uid() = user_id);

create policy "own vault insert"
  on public.vaults for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "own vault update"
  on public.vaults for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
