-- Add missing columns to job_cards table
ALTER TABLE job_cards 
  ADD COLUMN IF NOT EXISTS job_name TEXT,
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS priority TEXT,
  ADD COLUMN IF NOT EXISTS fabrication_status TEXT DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS assembling_status TEXT DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS fabrication_by UUID,
  ADD COLUMN IF NOT EXISTS fabrication_by_name TEXT,
  ADD COLUMN IF NOT EXISTS assembling_by UUID,
  ADD COLUMN IF NOT EXISTS assembling_by_name TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;