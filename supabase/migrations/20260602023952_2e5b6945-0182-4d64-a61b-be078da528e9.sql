ALTER TABLE public.article_recommendations
  ADD COLUMN IF NOT EXISTS question text,
  ADD COLUMN IF NOT EXISTS suggested_essay text;