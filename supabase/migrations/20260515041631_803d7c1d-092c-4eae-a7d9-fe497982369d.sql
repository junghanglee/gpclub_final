ALTER TABLE public.popups ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS popups_active_priority_idx ON public.popups (active, priority DESC, created_at DESC);