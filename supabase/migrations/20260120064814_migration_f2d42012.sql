-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Only admins can insert users" ON users;

-- Create a new policy that allows public user registration
CREATE POLICY "Allow public user registration" ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;