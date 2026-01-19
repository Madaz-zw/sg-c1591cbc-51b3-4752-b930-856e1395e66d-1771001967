-- Create board_transactions table
CREATE TABLE IF NOT EXISTS board_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('manufacture', 'sale')),
  quantity INTEGER NOT NULL,
  job_card_number TEXT,
  customer_name TEXT,
  notes TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE board_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view board transactions" ON board_transactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create transactions" ON board_transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);