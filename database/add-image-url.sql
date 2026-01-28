-- Add image_url column to desks table for storing space images
ALTER TABLE desks 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add index for faster queries if needed
CREATE INDEX IF NOT EXISTS idx_desks_image_url ON desks(image_url) WHERE image_url IS NOT NULL;

