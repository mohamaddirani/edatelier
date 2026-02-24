import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getOptimizedImageUrl } from '@/lib/imageUrl';

interface DressCardProps {
  id: string;
  slug: string;
  name: string;
  image_url: string;
  is_available: boolean;
  priority?: boolean;
  color?: string;
  category?: string | null;
}

export default function DressCard({ 
  id,
  slug,
  name, 
  image_url, 
  is_available,
  priority = false,
  color,
  category,
}: DressCardProps) {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) setShouldLoad(true);
  }, [priority]);

  useEffect(() => {
    setImageLoaded(false);
  }, [image_url]);

  // Serve a 640px wide image for cards instead of full resolution
  const optimizedSrc = useMemo(
    () => getOptimizedImageUrl(image_url || '', { width: 1024, quality: 85 }),
    [image_url]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );

    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  const categoryLabel = category === 'abaya' ? 'Abaya' 
    : category === 'clutch' ? 'Clutch' 
    : category === 'scarf' ? 'Scarf' 
    : null;

  return (
    <Card 
      className="overflow-hidden group hover:shadow-elegant transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/30"
      onClick={() => navigate(`/dress/${slug || id}`)}
    >
      <div className="relative" ref={imgRef}>
        <div className="w-full aspect-[3/4] overflow-hidden bg-muted relative">
          {shouldLoad ? (
            <>
              {/* Shimmer placeholder */}
              <div
                className={`absolute inset-0 transition-opacity duration-500 ${
                  imageLoaded ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted-foreground/5 to-muted animate-pulse" />
              </div>
              <img
                src={optimizedSrc}
                alt={name}
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={priority ? "high" : undefined}
                onLoad={() => setImageLoaded(true)}
                className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </>
          ) : (
            <div className="absolute inset-0 w-full h-full bg-muted" />
          )}
        </div>
        {!is_available && (
          <Badge className="absolute top-3 right-3 bg-destructive/90 backdrop-blur-sm z-10">
            Unavailable
          </Badge>
        )}
        {categoryLabel && (
          <Badge variant="outline" className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm z-10 text-xs">
            {categoryLabel}
          </Badge>
        )}
      </div>
      <div className="p-4 space-y-1">
        <h3 className="font-semibold text-base text-center line-clamp-1">{name}</h3>
        {color && (
          <p className="text-xs text-muted-foreground text-center">{color}</p>
        )}
      </div>
    </Card>
  );
}
