-- Additive upgrade migration. Run once in Supabase SQL Editor.
create extension if not exists pgcrypto;
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
create table if not exists public.university_requirements(id uuid primary key default gen_random_uuid(),university_id uuid not null references public.universities(id) on delete cascade,admission_cycle text not null default 'Verification Required',overview text default '',location text default '',admission_requirements text default '',sat_act_policy text default '',sat_recommended_target text default '',english_requirements text default '',academic_prerequisites text default '',application_deadlines text default '',essays_recommendations text default '',required_documents text default '',financial_aid text default '',application_portal_url text default '',admissions_url text default '',source_url text default '',last_verified date,verification_status text not null default 'Verification Required',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(university_id,admission_cycle));
alter table public.university_requirements enable row level security;
drop policy if exists "Public read university requirements" on public.university_requirements;
create policy "Public read university requirements" on public.university_requirements for select to anon, authenticated using (true);
alter table public.roadmap_tasks enable row level security;
drop policy if exists "Users manage own roadmap" on public.roadmap_tasks;
create policy "Users manage own roadmap" on public.roadmap_tasks for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
alter table public.saved_opportunities enable row level security;
drop policy if exists "Users manage own saved opportunities" on public.saved_opportunities;
create policy "Users manage own saved opportunities" on public.saved_opportunities for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
insert into public.opportunities(title,organization,category,country,description,eligibility,official_url,source_url,application_process,verification_status,active)
select 'Regeneron International Science and Engineering Fair (ISEF)','Society for Science','Research competition','International','Students must qualify through an affiliated science fair; direct ISEF registration is not the qualification route.','Eligibility, grade, age, country, deadlines and fees: verify with the affiliated fair and current official rules.','https://www.societyforscience.org/isef/','https://www.societyforscience.org/isef/','Qualify through a Society for Science-affiliated fair.','Official overview link recorded; cycle details Verification Required',true
where not exists(select 1 from public.opportunities where title='Regeneron International Science and Engineering Fair (ISEF)');
insert into public.opportunities(title,organization,category,country,description,eligibility,official_url,source_url,application_process,verification_status,active)
select 'National Science and Engineering Fair Pakistan (NSEF)','Pakistan organizer to verify','Research competition','Pakistan','Current eligibility and ISEF affiliation require verification. No international qualification is promised.','Age, grade, country, deadlines, fees and ISEF affiliation: Verification Required.','', '','Official application process: Verification Required.','Verification Required',true
where not exists(select 1 from public.opportunities where title='National Science and Engineering Fair Pakistan (NSEF)');
