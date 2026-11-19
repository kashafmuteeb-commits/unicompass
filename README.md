# UniCompass
AI-powered university preparation and student opportunity platform.

## Roadmap upgrade

Run `supabase/migrations/20261119_roadmap_upgrade.sql` once in the Supabase SQL Editor before using the upgrade features. This is additive and preserves existing user data. Existing authentication, public Supabase configuration and RLS policies are reused.

The roadmap is generated from grade, major and intended admission year. Tasks support completion, status, deadline and official-resource fields. The opportunities directory clearly distinguishes verified links from **Verification Required** information. ISEF qualification is explained through affiliated fairs, and NSEF Pakistan eligibility or ISEF affiliation is never assumed.
