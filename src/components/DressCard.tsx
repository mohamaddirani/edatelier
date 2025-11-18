import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DressCardProps {
  id: string;
  name: string;
  image_url: string;
  is_available: boolean;
  priority?: boolean;
}

interface DressImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export default function DressCard({ 
  id,
  name, 
  image_url, 
  is_available,
  priority = false
}: DressCardProps) {
  const navigate = useNavigate();
  const [primaryImage, setPrimaryImage] = useState<string>(image_url);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

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
        rootMargin: '50px',
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (shouldLoad && image_url && image_url !== primaryImage) {
      // Only fetch from database if we don't have a valid image_url prop
      fetchPrimaryImage();
    }
  }, [shouldLoad, id, image_url]);

  const fetchPrimaryImage = async () => {
    try {
      const { data, error } = await supabase
        .from('dress_images')
        .select('*')
        .eq('dress_id', id)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const primary = data.find(img => img.is_primary) || data[0];
        if (primary.image_url !== image_url) {
          setPrimaryImage(primary.image_url);
        }
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  return (
    <Card 
      className="overflow-hidden group hover:shadow-elegant transition-shadow duration-300 cursor-pointer"
      onClick={() => navigate(`/dress/${id}`)}
    >
      <div className="relative" ref={imgRef}>
        <div className="w-full h-[421px] overflow-hidden bg-muted relative">
          {shouldLoad ? (
            <>
              <div className="absolute inset-0 bg-muted" />
              <img
                src={primaryImage}
                alt={name}
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
                decoding="async"
                width="316"
                height="421"
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
