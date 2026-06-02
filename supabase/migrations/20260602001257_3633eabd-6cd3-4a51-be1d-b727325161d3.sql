-- Substack source (one or many feed URLs per user)
CREATE TABLE public.substack_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  feed_url TEXT NOT NULL,
  publication_name TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, feed_url)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.substack_sources TO authenticated;
GRANT ALL ON public.substack_sources TO service_role;
ALTER TABLE public.substack_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sources" ON public.substack_sources FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER substack_sources_touch BEFORE UPDATE ON public.substack_sources
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Articles: published (from RSS), drafts, notes, fragments
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('published','draft','note','fragment')),
  title TEXT NOT NULL,
  url TEXT,
  guid TEXT,
  published_at TIMESTAMPTZ,
  content_text TEXT NOT NULL DEFAULT '',
  content_html TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  themes TEXT[] NOT NULL DEFAULT '{}',
  summary TEXT,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, guid)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.articles TO authenticated;
GRANT ALL ON public.articles TO service_role;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own articles" ON public.articles FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER articles_touch BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX articles_user_published_idx ON public.articles (user_id, published_at DESC);
CREATE INDEX articles_themes_gin ON public.articles USING GIN (themes);

-- Aggregated themes (the writing DNA)
CREATE TABLE public.writing_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  frequency INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'recurring' CHECK (status IN ('recurring','emerging','core')),
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.writing_themes TO authenticated;
GRANT ALL ON public.writing_themes TO service_role;
ALTER TABLE public.writing_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own themes" ON public.writing_themes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER writing_themes_touch BEFORE UPDATE ON public.writing_themes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Article recommendations
CREATE TABLE public.article_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  rationale TEXT NOT NULL,
  gap TEXT,
  outline TEXT,
  connects_to UUID[] NOT NULL DEFAULT '{}',
  themes TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','dismissed','drafted','published')),
  score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_recommendations TO authenticated;
GRANT ALL ON public.article_recommendations TO service_role;
ALTER TABLE public.article_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own recs" ON public.article_recommendations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER recs_touch BEFORE UPDATE ON public.article_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Unfinished threads: questions/topics you keep returning to but never developed
CREATE TABLE public.unfinished_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  topic TEXT NOT NULL,
  question TEXT,
  evidence TEXT,
  mentions_count INT NOT NULL DEFAULT 1,
  sources TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','dismissed','resolved')),
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unfinished_threads TO authenticated;
GRANT ALL ON public.unfinished_threads TO service_role;
ALTER TABLE public.unfinished_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own threads" ON public.unfinished_threads FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER threads_touch BEFORE UPDATE ON public.unfinished_threads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();