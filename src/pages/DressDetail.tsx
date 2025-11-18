import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface DressImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

interface Dress {
  id: string;
  name: string;
  description: string | null;
  price_per_day: number | null;
  image_url: string | null;
  size: string | null;
  color: string | null;
  is_available: boolean;
}

export default function DressDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dress, setDress] = useState<Dress | null>(null);
  const [images, setImages] = useState<DressImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchDress();
      fetchImages();
    }
  }, [id]);

  const fetchDress = async () => {
    try {
      const { data, error } = await supabase
        .from('dresses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setDress(data);
    } catch (error) {
      console.error('Error fetching dress:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('dress_images')
        .select('*')
        .eq('dress_id', id)
        .order('display_order', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        // Fallback to legacy image
        const { data: dressData } = await supabase
          .from('dresses')
          .select('image_url')
          .eq('id', id)
          .single();

        if (dressData?.image_url) {
          const fallbackImage = {
            id: 'legacy',
            image_url: dressData.image_url,
            is_primary: true,
            display_order: 0,
          };
          setImages([fallbackImage]);
          setSelectedImage(dressData.image_url);
        }
      } else {
        setImages(data);
        const primary = data.find(img => img.is_primary) || data[0];
        setSelectedImage(primary.image_url);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </main>
    );
  }

  if (!dress) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Dress not found</p>
        <Button onClick={() => navigate('/')}>Go Back</Button>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <Button
          variant="ghost"
          onClick={() => {
            sessionStorage.removeItem('shopScrollPosition');
            navigate(-1);
          }}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Collection
        </Button>

        <h1 className="text-4xl font-bold mb-8">{dress.name}</h1>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-muted">
              <img
                src={selectedImage}
                alt={dress.name}
                width="600"
                height="800"
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {images.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(image.image_url)}
                    className={`aspect-[3/4] rounded-md overflow-hidden border-2 transition-colors ${
                      selectedImage === image.image_url
                        ? 'border-primary'
                        : 'border-transparent hover:border-primary/50'
                    }`}
                  >
                    <img
                      src={image.image_url}
                      alt={`${dress.name} thumbnail`}
                      width="150"
                      height="200"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {dress.description && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground">{dress.description}</p>
              </div>
            )}
          </div>

          {/* Dress Details */}
          <div>
            {!dress.is_available && (
              <Badge variant="destructive" className="mb-4">
                Unavailable
              </Badge>
            )}

            <div className="space-y-4 mb-6">
              {dress.size && (
                <div>
                  <span className="font-semibold">Size: </span>
                  <Badge variant="outline">{dress.size}</Badge>
                </div>
              )}
              {dress.color && (
                <div>
                  <span className="font-semibold">Color: </span>
                  <Badge variant="outline">{dress.color}</Badge>
                </div>
              )}
            </div>

            {dress.price_per_day && dress.price_per_day > 0 ? (
              <div className="mb-6">
                <p className="text-4xl font-bold text-primary">
                  ${dress.price_per_day}
                  <span className="text-lg text-muted-foreground">/day</span>
                </p>
              </div>
            ) : null}

            <Button 
              size="lg" 
              className="w-full"
              onClick={() => window.open(`https://api.whatsapp.com/send?phone=9613836748&text=Hello, I'm interested in renting: ${dress.name}`, '_blank')}
            >
              Contact for Rental
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
