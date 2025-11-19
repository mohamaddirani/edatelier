import { supabase } from '../lib/supabaseClient';

export type TransformOptions = {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  // Supabase will auto-select efficient formats (WebP/AVIF) if you omit format.
  // Use format: 'origin' to preserve original file format.
  format?: 'origin' | string;
  resize?: 'cover' | 'contain' | 'fill' | string;
  [key: string]: unknown;
};

/**
 * Request a transformed public URL from Supabase.
 * This uses the v2 API form: getPublicUrl(path, { transform })
 * and returns data.publicUrl.
 */
export function getTransformedPublicUrl(bucket: string, path: string, transform?: TransformOptions) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path, { transform });
  return data.publicUrl;
}

/**
 * Create a signed URL for a private object with optional transform baked in.
 * For private buckets, transforms must be provided when creating the signed URL.
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
