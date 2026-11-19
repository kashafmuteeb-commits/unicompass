# UniCompass
AI-powered university preparation and student opportunity platform.

## Roadmap upgrade setup

The upgrade is additive and preserves existing profile, roadmap, university and opportunity rows. Before using the new profile-grade field, task priorities/statuses and opportunity metadata, run `supabase/migrations/20261119_roadmap_upgrade.sql` in the Supabase SQL editor. Existing authentication and the public Supabase client are reused; the migration does not contain or require a service-role key.

The personalized roadmap uses the student's profile grade, major and intended start year and stores tasks in the existing user-owned `roadmap_tasks` table. Task updates are restricted by the existing Supabase RLS ownership policies. Official admission requirements and organizer details are shown as **Verification Required** unless current source-backed information is available. Suggested preparation targets are not admissions cutoffs. ISEF qualification requires an affiliated fair; NSEF Pakistan's current eligibility and ISEF affiliation are not assumed.

Serve the static site over HTTP(S) (for example GitHub Pages) so browser module imports and Supabase authentication work.
