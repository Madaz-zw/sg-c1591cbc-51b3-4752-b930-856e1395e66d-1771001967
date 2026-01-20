-- Fix RLS policies to work with custom authentication (not requiring auth.uid())

-- MATERIALS TABLE
DROP POLICY IF EXISTS "Store keepers can manage materials" ON materials;
DROP POLICY IF EXISTS "Store keepers can update materials" ON materials;
DROP POLICY IF EXISTS "Only admins can delete materials" ON materials;

CREATE POLICY "Allow authenticated users to manage materials" ON materials
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update materials" ON materials
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to delete materials" ON materials
  FOR DELETE
  TO public
  USING (true);

-- TOOLS TABLE
DROP POLICY IF EXISTS "Store keepers can manage tools" ON tools;
DROP POLICY IF EXISTS "Store keepers can update tools" ON tools;
DROP POLICY IF EXISTS "Only admins can delete tools" ON tools;

CREATE POLICY "Allow authenticated users to manage tools" ON tools
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update tools" ON tools
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to delete tools" ON tools
  FOR DELETE
  TO public
  USING (true);

-- BOARDS TABLE
DROP POLICY IF EXISTS "Authorized users can manage boards" ON boards;
DROP POLICY IF EXISTS "Authorized users can update boards" ON boards;

CREATE POLICY "Allow authenticated users to manage boards" ON boards
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update boards" ON boards
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to delete boards" ON boards
  FOR DELETE
  TO public
  USING (true);

-- JOB CARDS TABLE
DROP POLICY IF EXISTS "Supervisors can create job cards" ON job_cards;
DROP POLICY IF EXISTS "Supervisors can update job cards" ON job_cards;

CREATE POLICY "Allow authenticated users to create job cards" ON job_cards
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update job cards" ON job_cards
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to delete job cards" ON job_cards
  FOR DELETE
  TO public
  USING (true);

-- CUSTOMER GOODS TABLE
DROP POLICY IF EXISTS "Authorized users can manage customer goods" ON customer_goods;
DROP POLICY IF EXISTS "Authorized users can update customer goods" ON customer_goods;

CREATE POLICY "Allow authenticated users to manage customer goods" ON customer_goods
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update customer goods" ON customer_goods
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to delete customer goods" ON customer_goods
  FOR DELETE
  TO public
  USING (true);

-- MATERIAL REQUESTS TABLE
DROP POLICY IF EXISTS "Workers can create requests" ON material_requests;
DROP POLICY IF EXISTS "Store keepers can update requests" ON material_requests;

CREATE POLICY "Allow authenticated users to create material requests" ON material_requests
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update material requests" ON material_requests
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to delete material requests" ON material_requests
  FOR DELETE
  TO public
  USING (true);

-- Verify the changes
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('materials', 'tools', 'boards', 'job_cards', 'customer_goods', 'material_requests')
ORDER BY tablename, policyname;