-- Add is_active to firms for soft delete
ALTER TABLE firms ADD COLUMN is_active BOOLEAN DEFAULT true;
