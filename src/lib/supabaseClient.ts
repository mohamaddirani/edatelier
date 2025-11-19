import { createClient } from '@supabase/supabase-js';

/**
 * Read env var names used by Next.js and Vite.
 * - NEXT_PUBLIC_* is for Next.js
 * - VITE_* is for Vite
 *
 * Avoid throwing during SSR — only fail fast in the browser (dev).
 */
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_URL : undefined) as string | undefined);

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY : undefined) as string | undefined);

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
