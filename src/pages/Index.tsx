import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DressCard from '@/components/DressCard';
import ContactForm from '@/components/ContactForm';
import InteractiveBackground from '@/components/InteractiveBackground';
import FAQ from '@/components/FAQ';
import { AIDressChatbot } from '@/components/AIDressChatbot';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
    <div className="min-h-screen flex flex-col relative">
      <InteractiveBackground />
      <Navbar />
      
      {/* Hero Section */}
      <main>
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
          <Button size="lg" className="shadow-elegant" onClick={() => window.location.href = '/shop'}>
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
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory h-[481px]">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex-shrink-0 w-80 snap-center will-change-transform">
                  <Card className="overflow-hidden">
                    <div className="w-full h-[421px] bg-muted" />
                    <div className="p-4 h-[60px] flex items-center justify-center">
                      <div className="h-6 bg-muted/80 rounded w-3/4" />
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          ) : featuredDresses.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                No dresses available yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="relative group h-[481px]">
              <button
                onClick={() => {
                  const container = document.getElementById('featured-scroll');
                  if (container) container.scrollBy({ left: -350, behavior: 'smooth' });
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 border-2 border-border rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                aria-label="Scroll left to view previous dresses"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div id="featured-scroll" className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory h-full">
                {featuredDresses.map((dress, index) => (
                  <div key={dress.id} className="flex-shrink-0 w-80 snap-center will-change-transform">
                    <DressCard 
                      id={dress.id}
                      name={dress.name}
                      image_url={dress.image_url}
                      is_available={dress.is_available}
                      priority={index < 3}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const container = document.getElementById('featured-scroll');
                  if (container) container.scrollBy({ left: 350, behavior: 'smooth' });
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 border-2 border-border rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                aria-label="Scroll right to view more dresses"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
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

      {/* FAQ Section */}
      <FAQ />

      <Footer />
      </main>
      
      <AIDressChatbot />
    </div>
  );
}
