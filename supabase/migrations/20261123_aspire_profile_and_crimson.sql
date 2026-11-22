-- Add Aspire Fellowship and Harvard Crimson Essay Competition.
-- Safe to rerun: inserts only when a normalized title is not already present.

INSERT INTO public.opportunities (
    title,
    organization,
    category,
    country,
    description,
    eligibility,
    official_url,
    active
)
SELECT
    v.title,
    v.organization,
    v.category,
    v.country,
    v.description,
    v.eligibility,
    v.official_url,
    v.active
FROM (
    VALUES
    (
        'Aspire Fellowship – 1:1 Research Mentorship',
        'Aspire Research',
        'Research / Academic Fellowship',
        'Online',
        '12-week online research fellowship with individual 1:1 PhD-level mentorship. Research areas include Biotechnology, Biology, Medicine, Neuroscience, Environmental Science, Computer Science, Physics and Engineering. Includes research paper preparation, publication guidance and presentation development. Approx. 5–10 hours weekly outside mentor meetings. Tuition: $2,597. Partial merit-based and need-based scholarships advertised. Contact Aspire directly to ask about full funding.',
        'High school students. Confirm age, grade and international eligibility directly with Aspire.',
        'https://aspireresearch.net/welcome-fellowship',
        TRUE
    ),
    (
        'Harvard Crimson Global Essay Competition 2027',
        'The Harvard Crimson / Crimson Education',
        'Essay / Academic Competition',
        'Online - Worldwide',
        'International essay competition with Creative, Argumentative and Journalistic categories. Open to students aged 10–18 worldwide. Regional essay limit: 500 words. Global finalists submit 1,000–1,500 words. Early bird registration costs $15 until December 15, 2026; regular registration costs $20 until February 10, 2027. Regional essay deadline: February 23, 2027. Global submission deadline: March 19, 2027. Prizes, publication opportunities and mentorship are available to winners.',
        'Students aged 10–18 worldwide who meet the secondary/high school eligibility requirements.',
        'https://www.essaycomp.org/',
        TRUE
    )
) AS v(
    title,
    organization,
    category,
    country,
    description,
    eligibility,
    official_url,
    active
)
WHERE NOT EXISTS (
    SELECT 1
    FROM public.opportunities o
    WHERE LOWER(TRIM(o.title)) = LOWER(TRIM(v.title))
);
