DELETE FROM public.article_recommendations
WHERE status = 'open'
  AND (
    rationale ILIKE '%NOTES & BRAIN DUMPS%'
    OR rationale ILIKE '%[work]%'
    OR rationale ILIKE '%[admin]%'
    OR rationale ILIKE '%Walk dog%'
    OR rationale ILIKE '%Write paper%'
  );