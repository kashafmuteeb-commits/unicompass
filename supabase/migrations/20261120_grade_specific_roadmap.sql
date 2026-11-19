-- Grade-specific roadmap support. Additive and safe to run more than once.
alter table public.profiles
  add column if not exists current_grade text;

alter table public.roadmap_tasks
  add column if not exists roadmap_key text,
  add column if not exists priority text not null default 'Medium';

alter table public.roadmap_tasks enable row level security;
drop policy if exists "Users manage own roadmap" on public.roadmap_tasks;
create policy "Users manage own roadmap"
on public.roadmap_tasks for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
