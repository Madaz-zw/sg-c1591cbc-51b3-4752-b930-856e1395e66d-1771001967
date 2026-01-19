-- Create tool_transactions table
CREATE TABLE IF NOT EXISTS tool_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('checkout', 'return', 'damage')),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tool_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view tool transactions" ON tool_transactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create transactions" ON tool_transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);