
-- UNICOMPASS DATABASE
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- 1. STUDENT PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text default '',
  country text default '',
  current_education text default '',
  intended_degree text default '',
  intended_subject text default '',
  intended_start_year integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add fields if an older profiles table already exists.
alter table public.profiles
  add column if not exists country text default '',
  add column if not exists current_education text default '',
  add column if not exists intended_degree text default '',
  add column if not exists intended_subject text default '',
  add column if not exists intended_start_year integer,
  add column if not exists updated_at timestamptz default now();


-- 2. UNIVERSITIES
create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null,
  description text default '',
  admissions_url text default '',
  active boolean default true,
  created_at timestamptz default now()
);


-- 3. STUDENT UNIVERSITY GOALS
create table if not exists public.student_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  university_id uuid not null references public.universities(id) on delete cascade,
  subject text default '',
  degree_level text default '',
  created_at timestamptz default now(),
  unique(user_id, university_id)
);


-- 4. ACHIEVEMENTS
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text default 'Other',
  description text default '',
  date_completed date,
  evidence_url text default '',
  created_at timestamptz default now()
);


-- 5. DAILY JOURNAL
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  entry_date date not null default current_date,
  hours numeric(5,2) default 0,
  activity text default '',
  learning text default '',
  created_at timestamptz default now()
);


-- 6. ROADMAP TASKS
create table if not exists public.roadmap_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text default 'Planning',
  description text default '',
  due_date date,
  source_url text default '',
  status text default 'pending'
    check (status in ('pending', 'done')),
  sort_order integer default 0,
  created_at timestamptz default now()
);


-- 7. OPPORTUNITIES
create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organization text default '',
  category text default '',
  country text default '',
  description text default '',
  eligibility text default '',
  deadline date,
  official_url text default '',
  active boolean default true,
  created_at timestamptz default now()
);


-- 8. SAVED OPPORTUNITIES
create table if not exists public.saved_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, opportunity_id)
);


-- ENABLE ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.universities enable row level security;
alter table public.student_goals enable row level security;
alter table public.achievements enable row level security;
alter table public.journal_entries enable row level security;
alter table public.roadmap_tasks enable row level security;
alter table public.opportunities enable row level security;
alter table public.saved_opportunities enable row level security;


-- PROFILES POLICIES
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);


-- PUBLIC UNIVERSITY DIRECTORY
drop policy if exists "Anyone can view active universities" on public.universities;
create policy "Anyone can view active universities"
on public.universities for select
to anon, authenticated
using (active = true);


-- STUDENT GOALS POLICIES
drop policy if exists "Users manage own goals" on public.student_goals;
create policy "Users manage own goals"
on public.student_goals for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- ACHIEVEMENTS POLICIES
drop policy if exists "Users manage own achievements" on public.achievements;
create policy "Users manage own achievements"
on public.achievements for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- JOURNAL POLICIES
drop policy if exists "Users manage own journal" on public.journal_entries;
create policy "Users manage own journal"
on public.journal_entries for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- ROADMAP POLICIES
drop policy if exists "Users manage own roadmap" on public.roadmap_tasks;
create policy "Users manage own roadmap"
on public.roadmap_tasks for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- PUBLIC OPPORTUNITIES DIRECTORY
drop policy if exists "Anyone can view active opportunities" on public.opportunities;
create policy "Anyone can view active opportunities"
on public.opportunities for select
to anon, authenticated
using (active = true);


-- SAVED OPPORTUNITIES POLICIES
drop policy if exists "Users manage own saved opportunities" on public.saved_opportunities;
create policy "Users manage own saved opportunities"
on public.saved_opportunities for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- CREATE PROFILE AUTOMATICALLY AFTER SIGNUP
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();


-- STARTER UNIVERSITY DIRECTORY
insert into public.universities (name, country, description, admissions_url)
values
(
  'University of Oxford',
  'United Kingdom',
  'Research university with undergraduate and postgraduate programs.',
  'https://www.ox.ac.uk/admissions'
),
(
  'University of Cambridge',
  'United Kingdom',
  'University offering a wide range of academic programs.',
  'https://www.undergraduate.study.cam.ac.uk/'
),
(
  'Massachusetts Institute of Technology',
  'United States',
  'University known for science, engineering and research.',
  'https://mitadmissions.org/'
),
(
  'Stanford University',
  'United States',
  'Research university with interdisciplinary programs.',
  'https://admission.stanford.edu/'
),
(
  'ETH Zurich',
  'Switzerland',
  'University focused on science, technology and engineering.',
  'https://ethz.ch/en/studies.html'
),
(
  'National University of Singapore',
  'Singapore',
  'University with programs across science, business and humanities.',
  'https://nus.edu.sg/oam'
),
(
  'University of Toronto',
  'Canada',
  'Research university with a broad range of degree programs.',
  'https://future.utoronto.ca/'
),
(
  'University of Melbourne',
  'Australia',
  'University offering undergraduate and postgraduate education.',
  'https://study.unimelb.edu.au/'
),
(
  'University of Tokyo',
  'Japan',
  'University with programs in science, technology and humanities.',
  'https://www.u-tokyo.ac.jp/en/'
),
(
  'University of Edinburgh',
  'United Kingdom',
  'University with programs across science and the arts.',
  'https://www.ed.ac.uk/studying/undergraduate'
),
(
  'Yale University',
  'United States',
  'Research university with undergraduate and graduate programs.',
  'https://admissions.yale.edu/'
),
(
  'Princeton University',
  'United States',
  'University offering undergraduate and graduate study.',
  'https://admission.princeton.edu/'
)
on conflict do nothing;
