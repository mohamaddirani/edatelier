-- Helper to convert slugs into title-cased identifiers (e.g. perla-g-092025 -> Perla-G-092025)
CREATE OR REPLACE FUNCTION public.format_dress_identifier(slug_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN slug_value IS NULL OR slug_value = '' THEN NULL
    ELSE regexp_replace(
      initcap(regexp_replace(slug_value, '-', ' ', 'g')),
      '\\s+',
      '-',
      'g'
    )
  END;
$$;

-- Generate both slug and identifier from dress metadata
CREATE OR REPLACE FUNCTION public.generate_dress_identity(
  dress_name text,
  dress_color text,
  created_date timestamp with time zone
)
RETURNS TABLE (slug text, identifier text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_name text;
  base_slug text;
  color_value text;
  color_initial text;
  final_slug text;
  suffix integer := 0;
  timestamp_value timestamp with time zone := COALESCE(created_date, now());
BEGIN
  normalized_name := trim(regexp_replace(COALESCE(dress_name, 'Dress'), '[^a-zA-Z0-9\s-]', '', 'g'));
  IF normalized_name = '' THEN
    normalized_name := 'Dress';
  END IF;

  base_slug := lower(normalized_name);
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');

  color_value := COALESCE(NULLIF(trim(dress_color), ''), 'X');
  color_initial := upper(substring(color_value from 1 for 1));

  final_slug := base_slug || '-' || color_initial || '-' || to_char(timestamp_value, 'MMYYYY');

  LOOP
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.dresses WHERE slug = final_slug
    );
    suffix := suffix + 1;
    final_slug := base_slug || '-' || color_initial || '-' || to_char(timestamp_value, 'MMYYYY') || '-' || suffix;
  END LOOP;

  slug := final_slug;
  identifier := public.format_dress_identifier(final_slug);
  RETURN;
END;
$$;

-- Keep existing RPC compatibility by delegating to generate_dress_identity
CREATE OR REPLACE FUNCTION public.generate_dress_slug(
  dress_name text,
  dress_color text,
  created_date timestamp with time zone
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  slug_value text;
  identifier_value text;
BEGIN
  SELECT slug, identifier
  INTO slug_value, identifier_value
  FROM public.generate_dress_identity(dress_name, dress_color, created_date);

  RETURN slug_value;
END;
$$;

-- Prepare new identifier column
ALTER TABLE public.dresses ADD COLUMN new_identifier text;

UPDATE public.dresses
SET new_identifier = public.format_dress_identifier(slug)
WHERE slug IS NOT NULL AND slug <> '';

UPDATE public.dresses d
SET new_identifier = identity.identifier
FROM public.generate_dress_identity(d.name, COALESCE(d.color, 'X'), d.created_at) AS identity
WHERE (d.new_identifier IS NULL OR d.new_identifier = '');

ALTER TABLE public.dresses
ALTER COLUMN new_identifier SET NOT NULL;

-- Update dependent dress_images rows before swapping primary keys
ALTER TABLE public.dress_images DROP CONSTRAINT dress_images_dress_id_fkey;
ALTER TABLE public.dress_images ADD COLUMN new_dress_id text;

UPDATE public.dress_images di
SET new_dress_id = d.new_identifier
FROM public.dresses d
WHERE di.dress_id = d.id;

ALTER TABLE public.dress_images ALTER COLUMN new_dress_id SET NOT NULL;

-- Replace primary key with new identifier
ALTER TABLE public.dresses DROP CONSTRAINT dresses_pkey;
ALTER TABLE public.dresses RENAME COLUMN id TO legacy_uuid;
ALTER TABLE public.dresses RENAME COLUMN new_identifier TO id;
ALTER TABLE public.dresses ADD CONSTRAINT dresses_pkey PRIMARY KEY (id);

-- Finalize dress_images schema and constraints
ALTER TABLE public.dress_images DROP COLUMN dress_id;
ALTER TABLE public.dress_images RENAME COLUMN new_dress_id TO dress_id;

ALTER TABLE public.dress_images
ADD CONSTRAINT dress_images_dress_id_fkey
FOREIGN KEY (dress_id) REFERENCES public.dresses(id) ON DELETE CASCADE;

DROP INDEX IF EXISTS idx_dress_images_dress_id;
DROP INDEX IF EXISTS idx_dress_images_primary;
CREATE INDEX idx_dress_images_dress_id ON public.dress_images(dress_id);
CREATE INDEX idx_dress_images_primary ON public.dress_images(dress_id, is_primary) WHERE is_primary = true;

-- Remove legacy UUIDs now that references are updated
ALTER TABLE public.dresses DROP COLUMN legacy_uuid;

-- Automatically populate slug + identifier for future inserts
CREATE OR REPLACE FUNCTION public.set_dress_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  identity record;
BEGIN
  IF NEW.created_at IS NULL THEN
    NEW.created_at := now();
  END IF;

  SELECT slug, identifier
  INTO identity
  FROM public.generate_dress_identity(
    NEW.name,
    COALESCE(NEW.color, 'X'),
    NEW.created_at
  );

  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := identity.slug;
  END IF;

  IF NEW.id IS NULL OR NEW.id = '' THEN
    NEW.id := identity.identifier;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_dress_identity_before_insert ON public.dresses;

CREATE TRIGGER set_dress_identity_before_insert
BEFORE INSERT ON public.dresses
FOR EACH ROW
EXECUTE FUNCTION public.set_dress_identity();
