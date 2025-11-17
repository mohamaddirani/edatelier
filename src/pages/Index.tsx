import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DressCard from '@/components/DressCard';
import ContactForm from '@/components/ContactForm';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface Dress {
  id: string;
  name: string;
  description: string;
  size: string;
  color: string;
  price_per_day: number | null;
  image_url: string;
  is_available: boolean;
  created_at: string;
}

export default function Index() {
  const [featuredDresses, setFeaturedDresses] = useState<Dress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedDresses();
  }, []);

  const fetchFeaturedDresses = async () => {
    try {
      const { data, error } = await supabase
        .from('dresses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setFeaturedDresses(data || []);
    } catch (error) {
      console.error('Error fetching dresses:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 -z-10" />
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Exquisite Designer Collections</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Elegance for Every
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Special Occasion
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover our curated collection of stunning designer dresses. 
            Rent the perfect gown for your unforgettable moments.
          </p>
          <Button size="lg" className="shadow-elegant">
            Browse Collection
          </Button>
        </div>
      </section>

      {/* Featured Dresses Section */}
      <section className="py-20 px-4 bg-gradient-card">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Featured Collection
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our newest arrivals - handpicked designer dresses that embody timeless elegance
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-[500px] bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : featuredDresses.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                No dresses available yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredDresses.map((dress) => (
                <DressCard 
                  key={dress.id} 
                  id={dress.id}
                  name={dress.name}
                  image_url={dress.image_url}
                  is_available={dress.is_available}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <ContactForm />
        </div>
      </section>

      <Footer />
    </div>
  );
}
