-- Update slug generation function to include first letter of color
CREATE OR REPLACE FUNCTION generate_dress_slug(dress_name text, dress_color text, created_date timestamp with time zone)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  color_initial text;
  counter integer := 0;
BEGIN
  -- Create base slug: lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(trim(regexp_replace(dress_name, '[^a-zA-Z0-9\s-]', '', 'g')));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  
  -- Get first letter of color (uppercase)
  color_initial := upper(substring(dress_color from 1 for 1));
  
  -- Add color initial and month-year suffix (e.g., -G-092025)
  base_slug := base_slug || '-' || color_initial || '-' || to_char(created_date, 'MMYYYY');
  
  final_slug := base_slug;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM dresses WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Regenerate slugs for all existing dresses with the new format
UPDATE dresses
SET slug = generate_dress_slug(name, COALESCE(color, 'X'), created_at);