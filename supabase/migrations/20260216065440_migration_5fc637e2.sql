-- Make the code field optional (allow NULL values)
ALTER TABLE tools 
ALTER COLUMN code DROP NOT NULL;