-- Add password column to users (for migration compatibility)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;

-- Add missing columns to material_transactions
ALTER TABLE material_transactions ADD COLUMN IF NOT EXISTS material_name TEXT;
ALTER TABLE material_transactions ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE material_transactions ADD COLUMN IF NOT EXISTS board_name TEXT;
ALTER TABLE material_transactions ADD COLUMN IF NOT EXISTS board_color TEXT;
ALTER TABLE material_transactions ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing columns to tool_transactions
ALTER TABLE tool_transactions ADD COLUMN IF NOT EXISTS tool_name TEXT;
ALTER TABLE tool_transactions ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE tool_transactions ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add checked_out_to/by columns to tools if they don't exist (names might have been different)
ALTER TABLE tools ADD COLUMN IF NOT EXISTS checked_out_to TEXT;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS checked_out_date TIMESTAMP WITH TIME ZONE;