
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_product_rating() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- has_role is referenced from RLS policies; policies run as the table owner so they don't need EXECUTE grants.
-- But our policies use has_role(auth.uid(), ...) — these are evaluated in the policy context, which uses the role of the querying user. Grant minimal execute back.
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
