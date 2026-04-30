-- Function to handle new user creation from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
  business_name TEXT;
  user_role TEXT;
BEGIN
  -- Extract metadata
  business_name := COALESCE(new.raw_user_meta_data->>'business_name', 'New Business');
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'user');

  -- Force admin role for specified email
  IF new.email = 'ayushpatel7869595243@gmail.com' THEN
    user_role := 'admin';
  END IF;
  
  -- Check if we have a tenant_id in metadata (for invited users)
  IF new.raw_user_meta_data->>'tenant_id' IS NOT NULL THEN
    new_tenant_id := (new.raw_user_meta_data->>'tenant_id')::UUID;
  ELSE
    -- For new admin signups, create a new tenant
    IF user_role = 'admin' THEN
      INSERT INTO public.tenants (name)
      VALUES (business_name)
      RETURNING id INTO new_tenant_id;
    END IF;
  END IF;

  -- Create the user record
  INSERT INTO public.users (id, email, name, role, tenant_id)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    user_role,
    new_tenant_id
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
