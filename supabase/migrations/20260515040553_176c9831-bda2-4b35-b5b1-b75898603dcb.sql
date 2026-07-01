
-- FAQs
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published faqs" ON public.faqs FOR SELECT USING (published = true);
CREATE POLICY "Admins read all faqs" ON public.faqs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert faqs" ON public.faqs FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update faqs" ON public.faqs FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete faqs" ON public.faqs FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Popups
CREATE TABLE public.popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  image_url text,
  cta_label text,
  cta_url text,
  active boolean NOT NULL DEFAULT false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active popups" ON public.popups FOR SELECT USING (active = true);
CREATE POLICY "Admins read all popups" ON public.popups FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert popups" ON public.popups FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update popups" ON public.popups FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete popups" ON public.popups FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Site settings (key/value)
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins insert settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update settings" ON public.site_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete settings" ON public.site_settings FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Chatbot training data
CREATE TABLE public.chatbot_training (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'qa',  -- 'qa' | 'product' | 'doc'
  title text,
  question text,
  answer text,
  content text,
  tags text[] DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chatbot_training ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read training" ON public.chatbot_training FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert training" ON public.chatbot_training FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update training" ON public.chatbot_training FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete training" ON public.chatbot_training FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Contact inquiries (general)
CREATE TABLE public.contact_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submits contact" ON public.contact_inquiries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read contacts" ON public.contact_inquiries FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update contacts" ON public.contact_inquiries FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete contacts" ON public.contact_inquiries FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_faqs_updated BEFORE UPDATE ON public.faqs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_popups_updated BEFORE UPDATE ON public.popups FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_training_updated BEFORE UPDATE ON public.chatbot_training FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
