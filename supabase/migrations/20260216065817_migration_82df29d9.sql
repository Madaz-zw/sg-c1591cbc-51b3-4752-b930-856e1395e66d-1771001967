-- Remove the UNIQUE constraint on the code column
ALTER TABLE tools 
DROP CONSTRAINT tools_code_key;