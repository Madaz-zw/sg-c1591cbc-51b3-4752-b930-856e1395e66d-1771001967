-- Create materials table
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  variant TEXT,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_threshold DECIMAL(10,2) NOT NULL DEFAULT 10,
  unit TEXT NOT NULL DEFAULT 'pcs',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, name, variant)
);

-- Enable RLS
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for materials
CREATE POLICY "Anyone can view materials" ON materials FOR SELECT USING (true);
CREATE POLICY "Store keepers can manage materials" ON materials FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'store_keeper'))
);
CREATE POLICY "Store keepers can update materials" ON materials FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'store_keeper'))
);
CREATE POLICY "Only admins can delete materials" ON materials FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);