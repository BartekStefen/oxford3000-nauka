-- EnglishFlow: uruchom jednorazowo w Supabase > SQL Editor.
create table if not exists public.englishflow_states (
 user_id uuid primary key references auth.users(id) on delete cascade,
 state jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now()
);
alter table public.englishflow_states enable row level security;
revoke all on public.englishflow_states from anon;
grant select, insert, update, delete on public.englishflow_states to authenticated;
drop policy if exists "EnglishFlow user owns state" on public.englishflow_states;
create policy "EnglishFlow user owns state" on public.englishflow_states for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
