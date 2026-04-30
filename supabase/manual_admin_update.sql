-- Run this in your Supabase SQL Editor if you have already signed up with this email
-- to manually upgrade the account to an admin and create a tenant for it.

DO $$
DECLARE
  target_user_id UUID;
  new_tenant_id UUID;
BEGIN
  -- Find the user in auth.users
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'ayushpatel7869595243@gmail.com';
  
  IF target_user_id IS NOT NULL THEN
    -- Check if they already have a tenant
    SELECT tenant_id INTO new_tenant_id FROM public.users WHERE id = target_user_id;
    
    -- If no tenant, create one
    IF new_tenant_id IS NULL THEN
      INSERT INTO public.tenants (name) VALUES ('Ayush Business') RETURNING id INTO new_tenant_id;
    END IF;
    
    -- Update the user's role to admin
    UPDATE public.users 
    SET role = 'admin', tenant_id = new_tenant_id
    WHERE id = target_user_id;
    
    -- Also update auth metadata so the token contains the right role (optional but recommended)
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', '"admin"')
    WHERE id = target_user_id;
    
  END IF;
END $$;
