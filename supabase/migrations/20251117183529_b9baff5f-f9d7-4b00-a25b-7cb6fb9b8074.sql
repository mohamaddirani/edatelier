-- Add condition and category fields to dresses table
ALTER TABLE public.dresses
ADD COLUMN IF NOT EXISTS condition TEXT CHECK (condition IN ('new', 'used')),
ADD COLUMN IF NOT EXISTS category TEXT;

-- Set default values for existing records
UPDATE public.dresses
SET condition = 'new'
WHERE condition IS NULL;

UPDATE public.dresses
SET category = 'dress'
WHERE category IS NULL;