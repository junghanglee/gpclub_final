CREATE TABLE IF NOT EXISTS public.home_content (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.home_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads home content" ON public.home_content;
CREATE POLICY "Public reads home content" ON public.home_content
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins write home content" ON public.home_content;
CREATE POLICY "Admins write home content" ON public.home_content
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_home_content_updated BEFORE UPDATE ON public.home_content FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
