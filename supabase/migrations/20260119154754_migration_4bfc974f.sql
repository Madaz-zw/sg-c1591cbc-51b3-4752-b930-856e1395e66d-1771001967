-- Update job_cards table
ALTER TABLE job_cards 
  ADD COLUMN IF NOT EXISTS board_type TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'fabrication',
  ADD COLUMN IF NOT EXISTS supervisor_id UUID,
  ADD COLUMN IF NOT EXISTS created_by_name TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Update customer_goods table
ALTER TABLE customer_goods
  ADD COLUMN IF NOT EXISTS received_by UUID,
  ADD COLUMN IF NOT EXISTS received_by_name TEXT;
  
-- Add foreign keys for new columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'job_cards_supervisor_id_fkey') THEN
    ALTER TABLE job_cards ADD CONSTRAINT job_cards_supervisor_id_fkey FOREIGN KEY (supervisor_id) REFERENCES users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'customer_goods_received_by_fkey') THEN
    ALTER TABLE customer_goods ADD CONSTRAINT customer_goods_received_by_fkey FOREIGN KEY (received_by) REFERENCES users(id);
  END IF;
END $$;