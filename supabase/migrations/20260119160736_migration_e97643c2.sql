-- Add missing columns to board_transactions
ALTER TABLE board_transactions 
  ADD COLUMN IF NOT EXISTS board_name TEXT,
  ADD COLUMN IF NOT EXISTS user_name TEXT,
  ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Rename transaction_type to type to match application code (simpler than mapping everywhere)
ALTER TABLE board_transactions RENAME COLUMN transaction_type TO type;