ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS core_argument text,
  ADD COLUMN IF NOT EXISTS tensions text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS open_loops text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS recurring_concepts text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_articles_recurring_concepts
  ON public.articles USING GIN (recurring_concepts);
CREATE INDEX IF NOT EXISTS idx_articles_tensions
  ON public.articles USING GIN (tensions);