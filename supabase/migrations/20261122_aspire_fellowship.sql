/* Additive Aspire Fellowship details and per-student application tracking. Run in Supabase SQL Editor. */

alter table public.opportunities
  add column if not exists format text not null default '',
  add column if not exists duration text not null default '',
  add column if not exists mentorship text not null default '',
  add column if not exists research_areas text not null default '',
  add column if not exists research_outcomes text not null default '',
  add column if not exists time_commitment text not null default '',
  add column if not exists tuition text not null default '',
  add column if not exists financial_aid text not null default '',
  add column if not exists eligibility_notes text not null default '',
  add column if not exists cohort_info text not null default '';

create table if not exists public.opportunity_application_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  application_status text not null default 'Interested'
    check (application_status in ('Interested', 'Applying', 'Applied', 'Accepted')),
  application_deadline date,
  scholarship_inquiry text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);

alter table public.opportunity_application_tracking enable row level security;
drop policy if exists "Users manage own opportunity application tracking" on public.opportunity_application_tracking;
create policy "Users manage own opportunity application tracking"
  on public.opportunity_application_tracking for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into public.opportunities (
  title, organization, category, country, description, eligibility,
  official_url, active, format, duration, mentorship, research_areas,
  research_outcomes, time_commitment, tuition, financial_aid,
  eligibility_notes, cohort_info
)
select
  'Aspire Fellowship – 1:1 Research Mentorship',
  'Aspire Research',
  'Research / Academic Fellowship',
  'Online',
  'A 12-week online research fellowship with individual 1:1 mentorship from a PhD-level research mentor. Research areas include Biotechnology, Biology, Medicine, Neuroscience, Environmental Science, Computer Science, Physics, Engineering and other disciplines. Outcomes may include research paper preparation, publication guidance, or a competition-ready research poster and presentation. Plan for approximately 5–10 hours per week outside mentor meetings. Tuition: $2,597. Partial merit-based and need-based scholarships are advertised; this is not represented as fully funded. Contact Aspire directly to ask about full funding.',
  'High school students. Age requirements, eligible grades and international applicant eligibility are not established here; confirm directly with Aspire before applying.',
  'https://aspireresearch.net/welcome-fellowship',
  true,
  'Online',
  '12 weeks',
  'Individual 1:1 mentorship with a PhD-level research mentor',
  'Biotechnology, Biology, Medicine, Neuroscience, Environmental Science, Computer Science, Physics, Engineering and other disciplines',
  'Research paper preparation, publication guidance, or competition-ready research poster and presentation',
  'Approximately 5–10 hours per week outside mentor meetings',
  '$2,597',
  'Partial merit-based and need-based scholarships are advertised. Full scholarship availability must be confirmed directly with Aspire. Students with financial constraints are encouraged to contact Aspire and ask about full funding. This opportunity is not described as fully funded.',
  'High school students. Confirm minimum/maximum age, eligible grade levels, and international applicant eligibility directly with Aspire; these details are not established in this listing.',
  'Cohort dates and application deadlines are not listed here; check the official website or contact Aspire.'
where not exists (
  select 1 from public.opportunities
  where lower(title) = lower('Aspire Fellowship – 1:1 Research Mentorship')
);
