import React from 'react';
import { getTransformedPublicUrl } from '../utils/imageUrl';

type Props = {
  title: string;
  price?: string | number;
  imagePath: string; // path inside bucket, e.g. "products/12345.jpg"
  bucket?: string; // default bucket name used in your project
  alt?: string;
  href?: string; // optional link target for the product card
};

export default function ProductCard({
  title,
  price,
  imagePath,
  bucket = 'public',
  alt = '',
  href = '#',
}: Props) {
  // Build responsive transformed URLs via Supabase helper (do not manually append query params).
  const small = getTransformedPublicUrl(bucket, imagePath, { width: 400, quality: 70 });
  const medium = getTransformedPublicUrl(bucket, imagePath, { width: 800, quality: 70 });
  const large = getTransformedPublicUrl(bucket, imagePath, { width: 1200, quality: 70 });

  // Fallback that preserves original format (if you want to avoid forcing a specific format).
  const fallback = getTransformedPublicUrl(bucket, imagePath, { width: 800, quality: 80, format: 'origin' });

  // Prevent default jump for href="#" while preserving normal navigation if href is a real URL.
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href === '#' || href.trim() === '') {
      e.preventDefault();
    }
  };

  return (
    <article className="product-card">
      <a href={href} aria-label={title} onClick={handleClick}>
        <div className="image-wrapper" style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
          <picture>
            {/* Let the browser pick optimized format (Supabase auto-chooses if you omit format) */}
            <source
              srcSet={`${small} 400w, ${medium} 800w, ${large} 1200w`}
              sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
            />
            {/* Fallback image */}
            <img
              src={fallback}
              srcSet={`${small} 400w, ${medium} 800w, ${large} 1200w`}
              sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
              alt={alt || title}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </picture>
        </div>
        <div className="meta">
          <h3>{title}</h3>
          {price != null && <p className="price">${price}</p>}
        </div>
      </a>
    </article>
  );
}
