-- Fix RLS policies for transaction tables to allow creating transactions without auth.uid()

-- TOOL TRANSACTIONS
DROP POLICY IF EXISTS "Authenticated users can create transactions" ON tool_transactions;
CREATE POLICY "Allow anyone to create tool transactions" ON tool_transactions
  FOR INSERT
  WITH CHECK (true);

-- MATERIAL TRANSACTIONS
DROP POLICY IF EXISTS "Authenticated users can create transactions" ON material_transactions;
CREATE POLICY "Allow anyone to create material transactions" ON material_transactions
  FOR INSERT
  WITH CHECK (true);

-- BOARD TRANSACTIONS
DROP POLICY IF EXISTS "Authenticated users can create transactions" ON board_transactions;
CREATE POLICY "Allow anyone to create board transactions" ON board_transactions
  FOR INSERT
  WITH CHECK (true);

-- Verify the policies are updated
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('tool_transactions', 'material_transactions', 'board_transactions')
ORDER BY tablename, policyname;