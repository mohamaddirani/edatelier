import React, { useEffect, useState } from 'react';

type Variant = { width: number; url: string };
type ManifestEntry = { src?: string; variants: Variant[]; placeholder?: string; width?: number };

type Props = {
  id: string;
  alt?: string;
  sizes?: string;
  className?: string;
  style?: React.CSSProperties;
};

export default function OptimizedImage({ id, alt = '', sizes = '100vw', className, style }: Props) {
  const [entry, setEntry] = useState<ManifestEntry | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch('/images/manifest.json')
      .then((r) => r.json())
      .then((m) => {
        if (!mounted) return;
        const e = m[id];
        setEntry(e || null);
      })
      .catch(() => setEntry(null));
    return () => { mounted = false; };
  }, [id]);

  if (!entry) {
    return <img src={`/images/optimized/${id}.webp`} alt={alt} className={className} style={style} loading="lazy" decoding="async" />;
  }

  const srcSet = entry.variants.map(v => `${v.url} ${v.width}w`).join(', ');
  const largest = entry.variants[entry.variants.length - 1]?.url ?? entry.src;

  return (
    <div style={{ position: 'relative', overflow: 'hidden', ...style }} className={className}>
      <img
        src={largest}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading="lazy"
        decoding="async"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </div>
  );
}
