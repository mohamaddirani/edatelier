-- Add slug column to dresses table for meaningful URLs
ALTER TABLE dresses ADD COLUMN slug text;

-- Create index for slug lookups
CREATE INDEX idx_dresses_slug ON dresses(slug);

-- Function to generate slug from dress name and created date
CREATE OR REPLACE FUNCTION generate_dress_slug(dress_name text, created_date timestamp with time zone)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Create base slug: lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(trim(regexp_replace(dress_name, '[^a-zA-Z0-9\s-]', '', 'g')));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  
  -- Add month-year suffix (e.g., -092025)
  base_slug := base_slug || '-' || to_char(created_date, 'MMYYYY');
  
  final_slug := base_slug;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM dresses WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Update existing dresses with slugs
UPDATE dresses
SET slug = generate_dress_slug(name, created_at)
WHERE slug IS NULL;

-- Make slug NOT NULL after populating existing rows
ALTER TABLE dresses ALTER COLUMN slug SET NOT NULL;

-- Add unique constraint
ALTER TABLE dresses ADD CONSTRAINT dresses_slug_unique UNIQUE (slug);