-- Add missing location/contact fields used by the app UI and API.
ALTER TABLE firms
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS pin TEXT;
