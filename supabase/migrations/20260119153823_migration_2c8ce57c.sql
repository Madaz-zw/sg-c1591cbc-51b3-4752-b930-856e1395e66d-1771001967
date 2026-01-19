-- Create job_cards table
CREATE TABLE IF NOT EXISTS job_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_card_number TEXT UNIQUE NOT NULL,
  board_name TEXT NOT NULL,
  board_color TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  supervisor_name TEXT NOT NULL,
  fabrication_status TEXT DEFAULT 'pending' CHECK (fabrication_status IN ('pending', 'in_progress', 'completed')),
  fabrication_completed_at TIMESTAMP WITH TIME ZONE,
  assembling_status TEXT DEFAULT 'pending' CHECK (assembling_status IN ('pending', 'in_progress', 'completed')),
  assembling_completed_at TIMESTAMP WITH TIME ZONE,
  overall_status TEXT DEFAULT 'pending' CHECK (overall_status IN ('pending', 'in_progress', 'completed')),
  materials_used JSONB DEFAULT '[]',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE job_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view job cards" ON job_cards FOR SELECT USING (true);
CREATE POLICY "Supervisors can create job cards" ON job_cards FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'store_keeper', 'supervisor'))
);
CREATE POLICY "Supervisors can update job cards" ON job_cards FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'store_keeper', 'supervisor'))
);