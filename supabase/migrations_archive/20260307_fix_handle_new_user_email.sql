-- Fix handle_new_user trigger: sync email for returning OAuth users
-- Previously used ON CONFLICT DO NOTHING, which left email NULL for returning users.
-- Now uses DO UPDATE SET email WHERE profiles.email IS NULL (never overwrites valid email).
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'customer')
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email
    WHERE profiles.email IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
