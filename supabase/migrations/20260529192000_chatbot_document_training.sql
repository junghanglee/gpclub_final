-- Chatbot document training system: documents, chunks, jobs, retrieval metadata

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


CREATE TABLE IF NOT EXISTS public.chatbot_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  raw_content text,
  language text NOT NULL DEFAULT 'mixed',
  category text NOT NULL DEFAULT 'other',
  source_type text NOT NULL DEFAULT 'pasted_text',
  file_url text,
  status text NOT NULL DEFAULT 'active',
  enabled boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  tags text[] NOT NULL DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_documents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chatbot_documents' AND policyname = 'Admins read chatbot documents'
  ) THEN
    CREATE POLICY "Admins read chatbot documents" ON public.chatbot_documents
      FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chatbot_documents' AND policyname = 'Public read active chatbot documents'
  ) THEN
    CREATE POLICY "Public read active chatbot documents" ON public.chatbot_documents
      FOR SELECT TO anon, authenticated USING (enabled = true AND status = 'active');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chatbot_documents' AND policyname = 'Admins insert chatbot documents'
  ) THEN
    CREATE POLICY "Admins insert chatbot documents" ON public.chatbot_documents
      FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chatbot_documents' AND policyname = 'Admins update chatbot documents'
  ) THEN
    CREATE POLICY "Admins update chatbot documents" ON public.chatbot_documents
      FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chatbot_documents' AND policyname = 'Admins delete chatbot documents'
  ) THEN
    CREATE POLICY "Admins delete chatbot documents" ON public.chatbot_documents
      FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.chatbot_document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.chatbot_documents(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  content_hash text,
  language text NOT NULL DEFAULT 'mixed',
  token_count integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_document_chunks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chatbot_document_chunks' AND policyname = 'Admins read chatbot document chunks'
  ) THEN
    CREATE POLICY "Admins read chatbot document chunks" ON public.chatbot_document_chunks
      FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chatbot_document_chunks' AND policyname = 'Public read chunks for active chatbot documents'
  ) THEN
    CREATE POLICY "Public read chunks for active chatbot documents" ON public.chatbot_document_chunks
      FOR SELECT TO anon, authenticated USING (
        EXISTS (
          SELECT 1
          FROM public.chatbot_documents d
          WHERE d.id = chatbot_document_chunks.document_id
            AND d.enabled = true
            AND d.status = 'active'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chatbot_document_chunks' AND policyname = 'Admins insert chatbot document chunks'
  ) THEN
    CREATE POLICY "Admins insert chatbot document chunks" ON public.chatbot_document_chunks
      FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chatbot_document_chunks' AND policyname = 'Admins update chatbot document chunks'
  ) THEN
    CREATE POLICY "Admins update chatbot document chunks" ON public.chatbot_document_chunks
      FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chatbot_document_chunks' AND policyname = 'Admins delete chatbot document chunks'
  ) THEN
    CREATE POLICY "Admins delete chatbot document chunks" ON public.chatbot_document_chunks
      FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.chatbot_training_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.chatbot_documents(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued',
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_training_jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chatbot_training_jobs' AND policyname = 'Admins manage chatbot training jobs'
  ) THEN
    CREATE POLICY "Admins manage chatbot training jobs" ON public.chatbot_training_jobs
      FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

ALTER TABLE public.chatbot_records
  ADD COLUMN IF NOT EXISTS matched_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS matched_chunks jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS confidence numeric,
  ADD COLUMN IF NOT EXISTS needs_review boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS chat_ui_mode text NOT NULL DEFAULT 'natural',
  ADD COLUMN IF NOT EXISTS selected_tree_path jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.chatbot_tree_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_key text NOT NULL DEFAULT 'default',
  parent_id uuid REFERENCES public.chatbot_tree_nodes(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  label_ko text,
  label_en text,
  label_vi text,
  answer_ko text,
  answer_en text,
  answer_vi text,
  action_type text NOT NULL DEFAULT 'answer',
  linked_training_id uuid REFERENCES public.chatbot_training(id) ON DELETE SET NULL,
  linked_document_id uuid REFERENCES public.chatbot_documents(id) ON DELETE SET NULL,
  enabled boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_tree_nodes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chatbot_tree_nodes' AND policyname = 'Admins manage chatbot tree nodes'
  ) THEN
    CREATE POLICY "Admins manage chatbot tree nodes" ON public.chatbot_tree_nodes
      FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;


  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chatbot_tree_nodes' AND policyname = 'Public read enabled chatbot tree nodes'
  ) THEN
    CREATE POLICY "Public read enabled chatbot tree nodes" ON public.chatbot_tree_nodes
      FOR SELECT TO anon, authenticated USING (enabled = true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS chatbot_documents_status_enabled_idx ON public.chatbot_documents (status, enabled, updated_at DESC);
CREATE INDEX IF NOT EXISTS chatbot_documents_category_idx ON public.chatbot_documents (category);
CREATE INDEX IF NOT EXISTS chatbot_document_chunks_document_id_idx ON public.chatbot_document_chunks (document_id, chunk_index);
CREATE INDEX IF NOT EXISTS chatbot_document_chunks_content_fts_idx ON public.chatbot_document_chunks USING gin (to_tsvector('simple', content));
CREATE INDEX IF NOT EXISTS chatbot_tree_nodes_parent_idx ON public.chatbot_tree_nodes (scenario_key, parent_id, sort_order);
CREATE INDEX IF NOT EXISTS chatbot_tree_nodes_enabled_idx ON public.chatbot_tree_nodes (enabled, scenario_key);

DROP TRIGGER IF EXISTS trg_chatbot_documents_updated ON public.chatbot_documents;
CREATE TRIGGER trg_chatbot_documents_updated
BEFORE UPDATE ON public.chatbot_documents
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_chatbot_tree_nodes_updated ON public.chatbot_tree_nodes;
CREATE TRIGGER trg_chatbot_tree_nodes_updated
BEFORE UPDATE ON public.chatbot_tree_nodes
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
