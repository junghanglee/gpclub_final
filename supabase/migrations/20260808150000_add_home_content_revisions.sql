CREATE TABLE IF NOT EXISTS public.home_content_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key text NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS home_content_revisions_key_created_idx
  ON public.home_content_revisions (content_key, created_at DESC);

ALTER TABLE public.home_content_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read content revisions" ON public.home_content_revisions;
CREATE POLICY "Admins read content revisions" ON public.home_content_revisions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.save_home_content_version(
  p_key text,
  p_value jsonb,
  p_expected_updated_at timestamptz DEFAULT NULL
)
RETURNS public.home_content
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_row public.home_content;
  saved_row public.home_content;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can save home content' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO current_row
  FROM public.home_content
  WHERE key = p_key
  FOR UPDATE;

  IF current_row.key IS NULL THEN
    INSERT INTO public.home_content(key, value)
    VALUES (p_key, p_value)
    RETURNING * INTO saved_row;
    RETURN saved_row;
  END IF;

  IF p_expected_updated_at IS NOT NULL AND current_row.updated_at <> p_expected_updated_at THEN
    RAISE EXCEPTION 'Content changed since this editor was opened' USING ERRCODE = '40001';
  END IF;

  INSERT INTO public.home_content_revisions(content_key, value, created_by)
  VALUES (current_row.key, current_row.value, auth.uid());

  UPDATE public.home_content
  SET value = p_value
  WHERE key = p_key
  RETURNING * INTO saved_row;

  RETURN saved_row;
END;
$$;

REVOKE ALL ON FUNCTION public.save_home_content_version(text, jsonb, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_home_content_version(text, jsonb, timestamptz) TO authenticated;
