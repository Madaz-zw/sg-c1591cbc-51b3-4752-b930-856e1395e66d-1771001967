-- 1. Drop the restrictive constraint on boards table
ALTER TABLE boards DROP CONSTRAINT IF EXISTS boards_type_check;

-- 2. Update existing data to match new types (Mapping old -> new)
-- Mapping: Dinrail -> Surface Mounted, Hynman -> Mini-Flush (arbitrary mapping to preserve data)
UPDATE boards SET type = 'Surface Mounted' WHERE type = 'Dinrail';
UPDATE boards SET type = 'Mini-Flush' WHERE type = 'Hynman';

-- 3. Update job_cards data as well (it's text, so no constraint drop needed usually, but good to keep consistent)
UPDATE job_cards SET board_type = 'Surface Mounted' WHERE board_type ILIKE 'dinrail';
UPDATE job_cards SET board_type = 'Mini-Flush' WHERE board_type ILIKE 'hynman';

-- 4. Add new constraint with new allowed values
ALTER TABLE boards ADD CONSTRAINT boards_type_check 
  CHECK (type IN ('Surface Mounted', 'Mini-Flush', 'Watertight', 'Enclosure'));

-- 5. Also update job_cards check constraint if it exists (it wasn't in the schema output as a constraint, but let's be safe)
-- Schema showed board_type is text NULL, no check constraint listed in the schema output for job_cards.board_type.
-- So we are good there.