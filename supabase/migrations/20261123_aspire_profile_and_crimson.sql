-- Add profile fields used for opportunity matching, then add Aspire and Harvard Crimson listings.
-- Safe to rerun: opportunity rows are inserted only when their normalized title is absent.

alter table public.profiles
  add column if not exists age integer,
  add column if not exists current_grade text,
  add column if not exists curriculum text,
  add column if not exists academic_interests text not null default '',
  add column if not exists research_interests text not null default '',
  add column if not exists academic_background text not null default '';

insert into public.opportunities (
  title, organization, category, country, description, eligibility, official_url, active
)
select v.title, v.organization, v.category, v.country, v.description, v.eligibility, v.official_url, v.active
from (values
  (
    'Aspire Fellowship – 1:1 Research Mentorship',
    'Aspire Research',
    'Research / Academic Fellowship',
    'Online',
    '12-week online research fellowship with individual 1:1 PhD-level mentorship. Research areas include Biotechnology, Biology, Medicine, Neuroscience, Environmental Science, Computer Science, Physics and Engineering. Includes research paper preparation, publication guidance and presentation development. Approximately 5–10 hours weekly outside mentor meetings. Tuition: $2,597. Partial merit-based and need-based scholarships are advertised. Contact Aspire directly to ask about full funding; this opportunity is not described as fully funded.',
    'High school students. Confirm age, eligible grade levels and international applicant eligibility directly with Aspire; these details are not established in this listing.',
    'https://aspireresearch.net/welcome-fellowship',
    true
  ),
  (
    'Harvard Crimson Global Essay Competition 2027',
    'The Harvard Crimson / Crimson Education',
    'Essay / Academic Competition',
    'Online - Worldwide',
    'International essay competition with Creative, Argumentative and Journalistic categories. Open to students aged 10–18 worldwide. Regional essay limit: 500 words. Global finalists submit 1,000–1,500 words. Early bird registration costs $15 until December 15, 2026; regular registration costs $20 until February 10, 2027. Regional essay deadline: February 23, 2027. Global submission deadline: March 19, 2027. Prizes, publication opportunities and mentorship are available to winners.',
    'Students aged 10–18 worldwide who meet the secondary/high school eligibility requirements.',
    'https://www.essaycomp.org/',
    true
  )
) as v(title, organization, category, country, description, eligibility, official_url, active)
where not exists (
  select 1 from public.opportunities o
  where lower(trim(o.title)) = lower(trim(v.title))
);
