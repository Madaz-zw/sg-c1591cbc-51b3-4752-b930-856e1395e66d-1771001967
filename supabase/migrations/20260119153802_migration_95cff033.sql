-- Create material_requests table
CREATE TABLE IF NOT EXISTS material_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  material_name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  job_card_number TEXT NOT NULL,
  board_name TEXT NOT NULL,
  board_color TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  requested_by_name TEXT NOT NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by_name TEXT,
  approval_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE material_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view material requests" ON material_requests FOR SELECT USING (true);
CREATE POLICY "Workers can create requests" ON material_requests FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);
CREATE POLICY "Store keepers can update requests" ON material_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'store_keeper'))
);