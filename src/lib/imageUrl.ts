import { supabase } from '@/integrations/supabase/client';

export type TransformOptions = {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'origin';
  resize?: 'cover' | 'contain' | 'fill';
  [key: string]: unknown;
};

/**
 * Request a transformed public URL from Supabase.
 */
export function getTransformedPublicUrl(bucket: string, path: string, transform?: TransformOptions) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path, transform ? { transform: transform as any } : undefined);
  return data.publicUrl;
}

/**
 * Create a signed URL for a private object with optional transform baked in.
 */
export async function getTransformedSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 60,
  transform?: TransformOptions,
) {
  const options = transform ? { transform } : undefined;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn, options as any);
  if (error) throw error;
  return data.signedUrl;
}

const STORAGE_BASE = `https://krjafgbzeyfubpnqarmi.supabase.co/storage/v1/object/public/dress-images/`;

/**
 * Get optimized image URL by appending Supabase render transform query params.
 * Falls back to original URL if not a Supabase storage URL.
 */
export function getOptimizedImageUrl(
  url: string,
  options: { width?: number; height?: number; quality?: number } = {}
): string {
  if (!url || !url.includes('supabase.co/storage/v1/object/public/')) {
    return url;
  }
  
  const { width, height, quality = 75 } = options;
  const params = new URLSearchParams();
  if (width) params.set('width', String(width));
  if (height) params.set('height', String(height));
  params.set('quality', String(quality));
  params.set('resize', 'cover');
  
  // Use Supabase render endpoint
  const renderUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );
  
  return `${renderUrl}?${params.toString()}`;
}
