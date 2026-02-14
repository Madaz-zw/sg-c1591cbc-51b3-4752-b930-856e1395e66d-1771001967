-- Add board_name column to boards table
ALTER TABLE boards ADD COLUMN IF NOT EXISTS board_name text;

-- Update the unique constraint to include board_name
ALTER TABLE boards DROP CONSTRAINT IF EXISTS boards_type_color_key;
ALTER TABLE boards ADD CONSTRAINT boards_board_name_type_color_key UNIQUE (board_name, type, color);

-- Update board_transactions to match the new column name
ALTER TABLE board_transactions RENAME COLUMN type TO transaction_type;

-- Add constraint for transaction_type if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'board_transactions_transaction_type_check'
  ) THEN
    ALTER TABLE board_transactions ADD CONSTRAINT board_transactions_transaction_type_check 
    CHECK (transaction_type IN ('manufacture', 'sale', 'add', 'deduct', 'adjustment'));
  END IF;
END $$;