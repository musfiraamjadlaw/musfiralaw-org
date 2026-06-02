
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS questions text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS key_ideas text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS refs jsonb NOT NULL DEFAULT '{"books":[],"people":[],"concepts":[],"research":[]}'::jsonb,
  ADD COLUMN IF NOT EXISTS analyzed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_articles_user_analyzed ON public.articles(user_id, analyzed_at);
