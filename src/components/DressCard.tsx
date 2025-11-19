import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DressCardProps {
  id: string;
  name: string;
  image_url: string;
  is_available: boolean;
  priority?: boolean;
}

export default function DressCard({ 
  id,
  name, 
  image_url, 
  is_available,
  priority = false
}: DressCardProps) {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) {
      setShouldLoad(true);
    }
  }, [priority]);

  useEffect(() => {
    setImageLoaded(false);
  }, [image_url]);

  const resolvedSrc = useMemo(() => image_url || '', [image_url]);

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
      {
        rootMargin: '120px',
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <Card 
      className="overflow-hidden group hover:shadow-elegant transition-shadow duration-300 cursor-pointer"
      onClick={() => navigate(`/dress/${id}`)}
    >
      <div className="relative" ref={imgRef}>
        <div className="w-full h-[421px] overflow-hidden bg-muted relative">
          {shouldLoad ? (
            <>
              <div
                className={`absolute inset-0 bg-muted transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <img
                src={resolvedSrc}
                alt={name}
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                width={316}
                height={421}
                onLoad={() => setImageLoaded(true)}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </>
          ) : (
            <div className="absolute inset-0 w-full h-full bg-muted" />
          )}
        </div>
        {!is_available && (
          <Badge className="absolute top-4 right-4 bg-destructive z-10">
            Unavailable
          </Badge>
        )}
      </div>
      <div className="p-4 h-[60px] flex items-center justify-center">
        <h3 className="font-semibold text-lg text-center line-clamp-2">{name}</h3>
      </div>
    </Card>
  );
}
