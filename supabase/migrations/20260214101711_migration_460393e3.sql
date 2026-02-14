-- Update board_transactions constraint to allow add and deduct types
ALTER TABLE board_transactions DROP CONSTRAINT IF EXISTS board_transactions_transaction_type_check;
ALTER TABLE board_transactions ADD CONSTRAINT board_transactions_transaction_type_check 
  CHECK (transaction_type IN ('manufacture', 'sale', 'add', 'deduct', 'adjustment'));