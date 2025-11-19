import React, { useEffect, useState } from 'react';

type Variant = { width: number; url: string };
type ManifestEntry = {
  src?: string;
  variants: Variant[];
  placeholder?: string;
  width?: number;
  height?: number;
};

type Props = {
  id: string;
  alt?: string;
  sizes?: string;
  className?: string;
  style?: React.CSSProperties;
};

type Manifest = Record<string, ManifestEntry>;

let manifestCache: Manifest | null = null;
let manifestPromise: Promise<Manifest> | null = null;

const fetchManifest = () => {
  if (manifestCache) {
    return Promise.resolve(manifestCache);
  }

  if (!manifestPromise) {
    manifestPromise = fetch('/images/manifest.json')
      .then((r) => r.json())
      .then((m: Manifest) => {
        manifestCache = m;
        return m;
      })
      .catch((error) => {
        manifestPromise = null;
        throw error;
      });
  }

  return manifestPromise;
};

export default function OptimizedImage({ id, alt = '', sizes = '100vw', className, style }: Props) {
  const [entry, setEntry] = useState<ManifestEntry | null>(() => (manifestCache ? manifestCache[id] ?? null : null));

  useEffect(() => {
    if (manifestCache) {
      setEntry(manifestCache[id] ?? null);
      return;
    }

    let cancelled = false;
    fetchManifest()
      .then((manifest) => {
        if (!cancelled) {
          setEntry(manifest[id] ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEntry(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!entry) {
    return (
      <img
        src={`/images/optimized/${id}.webp`}
        alt={alt}
        className={className}
        style={style}
        loading="lazy"
        decoding="async"
      />
    );
  }

  const variants = (entry.variants || []).slice().sort((a, b) => a.width - b.width);
  const srcSet = variants.map((v) => `${v.url} ${v.width}w`).join(', ');
  const smallest = variants[0]?.url ?? entry.src;
  const largest = variants[variants.length - 1]?.url ?? entry.src;

  const intrinsicWidth = entry.width ?? variants[variants.length - 1]?.width;
  const intrinsicHeight = entry.height;

  return (
    <div style={{ position: 'relative', overflow: 'hidden', ...style }} className={className}>
      <img
        src={smallest ?? largest ?? `/images/optimized/${id}.webp`}
        srcSet={srcSet || undefined}
        sizes={sizes}
        alt={alt}
        loading="lazy"
        decoding="async"
        width={intrinsicWidth}
        height={intrinsicHeight}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </div>
  );
}
