-- Run this in Supabase SQL Editor to fix:
-- "Could not find the 'city' column of 'firms' in the schema cache"

ALTER TABLE public.firms
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS pin TEXT;

-- Refresh PostgREST schema cache by notifying Supabase API.
NOTIFY pgrst, 'reload schema';
