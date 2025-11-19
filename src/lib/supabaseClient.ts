import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if ((!SUPABASE_URL || !SUPABASE_ANON_KEY) && typeof window !== 'undefined') {
  // Fail fast in the browser during development so you don't accidentally call Supabase without keys.
  throw new Error('Missing Supabase env vars (NEXT_PUBLIC/VITE_SUPABASE_*).');
}

export const supabase = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '');

/**
 * Get a public URL for a storage object.
 * Uses Supabase JS v2 response shape: { data: { publicUrl } }
 */
export function getPublicStorageUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Create a signed URL for a private object.
 * If you need transformations for private objects, pass transform in options:
 * createSignedUrl(path, expiresIn, { transform: { width, height, quality } })
 *
 * Supabase bakes transform options into the signed token — adding query params
 * later will NOT work for private objects.
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 60,
  transform?: Record<string, unknown>,
) {
  const options = transform ? { transform } : undefined;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn, options as any);
  if (error) throw error;
  return data.signedUrl;
}
