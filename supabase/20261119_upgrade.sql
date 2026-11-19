-- UniCompass roadmap and opportunity upgrade
-- Backward-compatible: extends existing tables and adds only private/public tables.
-- Run in Supabase SQL Editor after reviewing the existing schema.

create extension if not exists pgcrypto;

alter table public.roadmap_tasks
  add column if not exists priority text,
  add column if not exists status_new text,
  add column if not exists official_resource_url text,
  add column if not exists verification_status text,
  add column if not exists source_url text;

-- Preserve existing statuses (pending/done) while introducing named statuses.
update public.roadmap_tasks
set status_new = case when status = 'done' then 'Completed' else 'Not Started' end
where status_new is null;

alter table public.roadmap_tasks
  alter column status_new set default 'Not Started';

alter table public.roadmap_tasks
  add constraint roadmap_tasks_priority_check
  check (priority is null or priority in ('Low', 'Medium', 'High')) not valid;

alter table public.roadmap_tasks
  add constraint roadmap_tasks_status_new_check
  check (status_new in ('Not Started', 'In Progress', 'Completed')) not valid;

alter table public.opportunities
  add column if not exists grade_requirements text,
  add column if not exists age_restrictions text,
  add column if not exists country_restrictions text,
  add column if not exists registration_deadline date,
  add column if not exists application_process text,
  add column if not exists fees text,
  add column if not exists fee_waivers text,
  add column if not exists official_application_url text,
  add column if not exists last_verified_date date,
  add column if not exists verification_status text default 'Verification Required',
  add column if not exists admission_cycle text;

alter table public.universities
  add column if not exists location text,
  add column if not exists overview text,
  add column if not exists application_portal_url text,
  add column if not exists application_deadlines text,
  add column if not exists admission_requirements text,
  add column if not exists sat_act_policy text,
  add column if not exists recommended_sat_range text,
  add column if not exists english_requirements text,
  add column if not exists academic_prerequisites text,
  add column if not exists essays_requirements text,
  add column if not exists recommendation_requirements text,
  add column if not exists required_documents text,
  add column if not exists scholarships text,
  add column if not exists source_url text,
  add column if not exists admission_cycle text,
  add column if not exists last_verified_date date,
  add column if not exists verification_status text default 'Verification Required';

create table if not exists public.roadmap_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade text not null,
  intended_start_year integer,
  intended_major text,
  active boolean default true,
  created_at timestamptz default now()
);

alter table public.roadmap_templates enable row level security;

drop policy if exists "Anyone can view active roadmap templates" on public.roadmap_templates;
create policy "Anyone can view active roadmap templates"
on public.roadmap_templates for select
to anon, authenticated
using (active = true);

create table if not exists public.user_roadmap_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  roadmap_task_id uuid references public.roadmap_tasks(id) on delete cascade,
  status text not null default 'Not Started'
    check (status in ('Not Started', 'In Progress', 'Completed')),
  completed_at timestamptz,
  updated_at timestamptz default now(),
  unique(user_id, roadmap_task_id)
);

alter table public.user_roadmap_progress enable row level security;

drop policy if exists "Users manage own roadmap progress" on public.user_roadmap_progress;
create policy "Users manage own roadmap progress"
on public.user_roadmap_progress for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Ensure opportunity detail fields remain public/readable.
drop policy if exists "Anyone can view active opportunities" on public.opportunities;
create policy "Anyone can view active opportunities"
on public.opportunities for select
to anon, authenticated
using (active = true);
