-- Create boards table (finished goods inventory)
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('dinrail', 'hynman')),
  color TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_threshold INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(type, color)
);

-- Enable RLS
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view boards" ON boards FOR SELECT USING (true);
CREATE POLICY "Authorized users can manage boards" ON boards FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'store_keeper', 'supervisor', 'sales_warehouse'))
);
CREATE POLICY "Authorized users can update boards" ON boards FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'store_keeper', 'supervisor', 'sales_warehouse'))
);