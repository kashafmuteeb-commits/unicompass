-- UniCompass roadmap and admissions upgrade; additive migration.
-- Run after the existing Supabase schema. Existing rows and tables are retained.

alter table public.profiles add column if not exists current_grade text;
alter table public.roadmap_tasks add column if not exists priority text not null default 'Medium';
alter table public.roadmap_tasks add column if not exists roadmap_key text;
alter table public.roadmap_tasks add column if not exists updated_at timestamptz not null default now();
alter table public.roadmap_tasks drop constraint if exists roadmap_tasks_status_check;
alter table public.roadmap_tasks add constraint roadmap_tasks_status_check check (status in ('pending','in_progress','done'));

alter table public.opportunities add column if not exists age_restrictions text default '';
alter table public.opportunities add column if not exists grade_requirements text default '';
alter table public.opportunities add column if not exists country_restrictions text default '';
alter table public.opportunities add column if not exists application_process text default '';
alter table public.opportunities add column if not exists fee_information text default '';
alter table public.opportunities add column if not exists fee_waiver_information text default '';
alter table public.opportunities add column if not exists last_verified date;
alter table public.opportunities add column if not exists verification_status text not null default 'Verification Required';
alter table public.opportunities add column if not exists source_url text default '';

create table if not exists public.university_requirements (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  admission_cycle text not null default 'Verification Required',
  overview text default '',
  location text default '',
  admission_requirements text default '',
  sat_act_policy text default '',
  sat_recommended_target text default '',
  english_requirements text default '',
  academic_prerequisites text default '',
  application_deadlines text default '',
  essays_recommendations text default '',
  required_documents text default '',
  financial_aid text default '',
  application_portal_url text default '',
  admissions_url text default '',
  source_url text default '',
  last_verified date,
  verification_status text not null default 'Verification Required',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(university_id, admission_cycle)
);
alter table public.university_requirements enable row level security;
drop policy if exists "Public read university requirements" on public.university_requirements;
create policy "Public read university requirements" on public.university_requirements for select to anon, authenticated using (true);

-- Public information is readable; public edits are intentionally not allowed.
drop policy if exists "Anyone can view active opportunities" on public.opportunities;
create policy "Anyone can view active opportunities" on public.opportunities for select to anon, authenticated using (active = true);

-- User-owned roadmap remains protected by the existing user_id RLS policy.
-- Recreate explicitly for consistent installations.
alter table public.roadmap_tasks enable row level security;
drop policy if exists "Users manage own roadmap" on public.roadmap_tasks;
create policy "Users manage own roadmap" on public.roadmap_tasks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.saved_opportunities enable row level security;
drop policy if exists "Users manage own saved opportunities" on public.saved_opportunities;
create policy "Users manage own saved opportunities" on public.saved_opportunities for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- These listings explicitly avoid claiming eligibility, fees or dates that have not been verified.
insert into public.opportunities (title,organization,category,country,description,eligibility,official_url,source_url,application_process,verification_status,active)
select 'Regeneron International Science and Engineering Fair (ISEF)','Society for Science','Research competition','International','Students must qualify through an affiliated science fair; direct ISEF registration is not the qualification route. Current requirements depend on the affiliated fair and current rules.','Age, grade, country, deadlines and fees: verify with the affiliated fair and current official rules.','https://www.societyforscience.org/isef/','https://www.societyforscience.org/isef/','Find and qualify through an affiliated fair; confirm the local route and rules with its organizer.','Official overview link recorded; cycle-specific eligibility Verification Required',true
where not exists (select 1 from public.opportunities where title='Regeneron International Science and Engineering Fair (ISEF)');

insert into public.opportunities (title,organization,category,country,description,eligibility,official_url,source_url,application_process,verification_status,active)
select 'National Science and Engineering Fair Pakistan (NSEF)','Pakistan competition organizer to verify','Research competition','Pakistan','Verify the current published eligibility and organizer information. No ISEF affiliation or international qualification is promised until confirmed by Society for Science and the organizer.','Current age, grade, country, deadlines, fees and affiliation: Verification Required.','', '','Contact/official organizer link: Verification Required. Confirm ISEF affiliation in Society for Science official listings before relying on qualification.','Verification Required',true
where not exists (select 1 from public.opportunities where title='National Science and Engineering Fair Pakistan (NSEF)');
