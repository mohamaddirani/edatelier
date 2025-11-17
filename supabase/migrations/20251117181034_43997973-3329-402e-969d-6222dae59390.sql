-- Make price_per_day optional in dresses table
ALTER TABLE public.dresses 
ALTER COLUMN price_per_day DROP NOT NULL;

-- Create dress_images table for multiple images
CREATE TABLE public.dress_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dress_id UUID NOT NULL REFERENCES public.dresses(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on dress_images
ALTER TABLE public.dress_images ENABLE ROW LEVEL SECURITY;

-- Create policies for dress_images
CREATE POLICY "Anyone can view dress images"
ON public.dress_images
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert dress images"
ON public.dress_images
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update dress images"
ON public.dress_images
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete dress images"
ON public.dress_images
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for better query performance
CREATE INDEX idx_dress_images_dress_id ON public.dress_images(dress_id);
CREATE INDEX idx_dress_images_primary ON public.dress_images(dress_id, is_primary) WHERE is_primary = true;