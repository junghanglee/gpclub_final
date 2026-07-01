CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_vi text NOT NULL,
  title_en text NOT NULL,
  summary_vi text,
  summary_en text,
  body_vi text,
  body_en text,
  media_url text,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'embed')),
  cta_label_vi text,
  cta_label_en text,
  cta_url text,
  event_date date,
  sort_order integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads published events" ON public.events;
CREATE POLICY "Public reads published events" ON public.events
  FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Admins read all events" ON public.events;
CREATE POLICY "Admins read all events" ON public.events
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins insert events" ON public.events;
CREATE POLICY "Admins insert events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update events" ON public.events;
CREATE POLICY "Admins update events" ON public.events
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete events" ON public.events;
CREATE POLICY "Admins delete events" ON public.events
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS events_public_order_idx ON public.events (published, featured DESC, sort_order DESC, event_date DESC, created_at DESC);
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
