CREATE OR REPLACE FUNCTION public.save_site_settings_version(
  p_values jsonb,
  p_expected_updated_at jsonb DEFAULT '{}'::jsonb
)
RETURNS SETOF public.site_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  setting_key text;
  current_row public.site_settings;
  expected_value text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can save site settings' USING ERRCODE = '42501';
  END IF;

  FOR setting_key IN SELECT jsonb_object_keys(p_values)
  LOOP
    SELECT * INTO current_row
    FROM public.site_settings
    WHERE key = setting_key
    FOR UPDATE;

    expected_value := p_expected_updated_at ->> setting_key;
    IF current_row.key IS NOT NULL
       AND (
         NOT (p_expected_updated_at ? setting_key)
         OR expected_value IS NULL
         OR current_row.updated_at <> expected_value::timestamptz
       ) THEN
      RAISE EXCEPTION 'Site settings changed in another editor' USING ERRCODE = '40001';
    END IF;
  END LOOP;

  FOR setting_key IN SELECT jsonb_object_keys(p_values)
  LOOP
    INSERT INTO public.site_settings(key, value)
    VALUES (setting_key, p_values -> setting_key)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
  END LOOP;

  RETURN QUERY
    SELECT * FROM public.site_settings
    WHERE key IN (SELECT jsonb_object_keys(p_values));
END;
$$;

REVOKE ALL ON FUNCTION public.save_site_settings_version(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_site_settings_version(jsonb, jsonb) TO authenticated;
