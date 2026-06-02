CREATE TABLE public.untangle_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  input TEXT NOT NULL,
  result JSONB NOT NULL,
  missing_condition TEXT,
  core_question TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.untangle_analyses TO authenticated;
GRANT ALL ON public.untangle_analyses TO service_role;

ALTER TABLE public.untangle_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own untangle analyses"
ON public.untangle_analyses
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_untangle_analyses_user_created ON public.untangle_analyses (user_id, created_at DESC);