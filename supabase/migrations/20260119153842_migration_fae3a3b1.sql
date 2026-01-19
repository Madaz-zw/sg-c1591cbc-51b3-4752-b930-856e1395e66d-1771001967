-- Create customer_goods table
CREATE TABLE IF NOT EXISTS customer_goods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'returned')),
  received_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE customer_goods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view customer goods" ON customer_goods FOR SELECT USING (true);
CREATE POLICY "Authorized users can manage customer goods" ON customer_goods FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'store_keeper', 'sales_warehouse'))
);
CREATE POLICY "Authorized users can update customer goods" ON customer_goods FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'store_keeper', 'sales_warehouse'))
);