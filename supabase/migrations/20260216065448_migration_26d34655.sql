-- Also make category optional since not all tools may have categories
ALTER TABLE tools 
ALTER COLUMN category DROP NOT NULL;