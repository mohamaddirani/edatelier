import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ImageGallery from './ImageGallery';

interface DressCardProps {
  id: string;
  name: string;
  description: string;
  price_per_day: number | null;
  image_url: string;
  size: string;
  color: string;
  is_available: boolean;
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
  description, 
  price_per_day, 
  image_url, 
  size, 
  color,
  is_available 
}: DressCardProps) {
  const [images, setImages] = useState<DressImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, [id]);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('dress_images')
        .select('*')
        .eq('dress_id', id)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      // If no images in dress_images table, use the legacy image_url
      if (!data || data.length === 0) {
        setImages([{
          id: 'legacy',
          image_url: image_url,
          is_primary: true,
          display_order: 0,
        }]);
      } else {
        setImages(data);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      // Fallback to legacy image
      setImages([{
        id: 'legacy',
        image_url: image_url,
        is_primary: true,
        display_order: 0,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden group hover:shadow-elegant transition-all duration-300">
      {loading ? (
        <div className="aspect-[3/4] bg-muted animate-pulse" />
      ) : (
        <div className="relative">
          <ImageGallery images={images} altText={name} />
          {!is_available && (
            <Badge className="absolute top-4 right-4 bg-destructive z-10">
              Unavailable
            </Badge>
          )}
        </div>
      )}
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2">{name}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{description}</p>
        <div className="flex gap-2 mb-2">
          <Badge variant="outline">{size}</Badge>
          <Badge variant="outline">{color}</Badge>
        </div>
      </CardContent>
      {price_per_day && (
        <CardFooter className="p-4 pt-0">
          <p className="text-2xl font-bold text-primary">
            ${price_per_day}<span className="text-sm text-muted-foreground">/day</span>
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
