ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS post_type text NOT NULL DEFAULT 'event' CHECK (post_type IN ('event', 'new_product'));

DROP INDEX IF EXISTS events_public_order_idx;
CREATE INDEX IF NOT EXISTS events_public_order_idx
  ON public.events (published, post_type, featured DESC, sort_order DESC, event_date DESC, created_at DESC);
