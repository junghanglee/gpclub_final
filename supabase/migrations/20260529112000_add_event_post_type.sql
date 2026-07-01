ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS post_type text NOT NULL DEFAULT 'event'
  CHECK (post_type IN ('event', 'new_product'));

CREATE INDEX IF NOT EXISTS events_post_type_public_order_idx
  ON public.events (post_type, published, sort_order DESC, event_date DESC, created_at DESC);
