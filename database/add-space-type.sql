-- Add space_type column to desks table
-- This allows filtering by space type: desk, meeting_room, parking_spot

ALTER TABLE desks 
ADD COLUMN IF NOT EXISTS space_type TEXT DEFAULT 'desk' 
CHECK (space_type IN ('desk', 'meeting_room', 'parking_spot'));

-- Update existing desks to have 'desk' as default if they don't have a type
UPDATE desks 
SET space_type = 'desk' 
WHERE space_type IS NULL;

-- Make space_type NOT NULL after setting defaults
ALTER TABLE desks 
ALTER COLUMN space_type SET NOT NULL;

