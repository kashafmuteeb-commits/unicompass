# UniCompass
AI-powered university preparation and student opportunity platform.

## Roadmap upgrade

Run `supabase/migrations/20261119_roadmap_upgrade.sql` and `supabase/migrations/20261120_grade_specific_roadmap.sql` in the Supabase SQL Editor before using the roadmap upgrades. These additive migrations preserve existing user data. Existing authentication, public Supabase configuration and RLS policies are reused.

The personalized roadmap uses the student's profile grade to provide distinct Grade 10 and Grade 11 tasks. Each task includes exact action steps, why it matters, a suggested timeline and free resources. Functional checkboxes save completion in the user's `roadmap_tasks` table, and the dashboard displays the completion count and progress percentage. Set the profile's current grade to Grade 10 or Grade 11 to receive the corresponding set of five tasks.

The existing broader roadmap is generated from grade, major and intended admission year. The opportunities directory clearly distinguishes verified links from **Verification Required** information. ISEF qualification is explained through affiliated fairs, and NSEF Pakistan eligibility or ISEF affiliation is never assumed.
