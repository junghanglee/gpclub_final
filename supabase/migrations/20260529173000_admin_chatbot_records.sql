-- Admin B2B notes and chatbot conversation records

ALTER TABLE public.b2b_inquiries
  ADD COLUMN IF NOT EXISTS admin_note text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_b2b_inquiries_updated ON public.b2b_inquiries;
CREATE TRIGGER trg_b2b_inquiries_updated
BEFORE UPDATE ON public.b2b_inquiries
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.chatbot_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  customer_message text NOT NULL,
  chatbot_reply text NOT NULL,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  source text NOT NULL DEFAULT 'gippy_chat',
  status text NOT NULL DEFAULT 'new',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chatbot_records' AND policyname = 'Anyone inserts chatbot records'
  ) THEN
    CREATE POLICY "Anyone inserts chatbot records" ON public.chatbot_records
      FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chatbot_records' AND policyname = 'Admins read chatbot records'
  ) THEN
    CREATE POLICY "Admins read chatbot records" ON public.chatbot_records
      FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chatbot_records' AND policyname = 'Admins update chatbot records'
  ) THEN
    CREATE POLICY "Admins update chatbot records" ON public.chatbot_records
      FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chatbot_records' AND policyname = 'Admins delete chatbot records'
  ) THEN
    CREATE POLICY "Admins delete chatbot records" ON public.chatbot_records
      FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS chatbot_records_created_at_idx ON public.chatbot_records (created_at DESC);
CREATE INDEX IF NOT EXISTS chatbot_records_session_id_idx ON public.chatbot_records (session_id);

DROP TRIGGER IF EXISTS trg_chatbot_records_updated ON public.chatbot_records;
CREATE TRIGGER trg_chatbot_records_updated
BEFORE UPDATE ON public.chatbot_records
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
