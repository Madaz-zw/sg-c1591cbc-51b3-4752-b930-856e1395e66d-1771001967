-- Create material_transactions table
CREATE TABLE IF NOT EXISTS material_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('issue', 'receive', 'return', 'adjustment')),
  quantity DECIMAL(10,2) NOT NULL,
  job_card_number TEXT,
  recipient_name TEXT,
  notes TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE material_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view material transactions" ON material_transactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create transactions" ON material_transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);