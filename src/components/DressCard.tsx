import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DressCardProps {
  id: string;
  name: string;
  image_url: string;
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
  image_url, 
  is_available 
}: DressCardProps) {
  const navigate = useNavigate();
  const [primaryImage, setPrimaryImage] = useState<string>(image_url);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrimaryImage();
  }, [id]);

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
        setPrimaryImage(primary.image_url);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      className="overflow-hidden group hover:shadow-elegant transition-all duration-300 cursor-pointer"
      onClick={() => navigate(`/dress/${id}`)}
    >
      {loading ? (
        <div className="aspect-[3/4] bg-muted animate-pulse" />
      ) : (
        <div className="relative">
          <div className="aspect-[3/4] overflow-hidden">
            <img
              src={primaryImage}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          {!is_available && (
            <Badge className="absolute top-4 right-4 bg-destructive z-10">
              Unavailable
            </Badge>
          )}
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-center">{name}</h3>
      </div>
    </Card>
  );
}
