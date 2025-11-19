import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DressCard from '@/components/DressCard';
import InteractiveBackground from '@/components/InteractiveBackground';
import { AIDressChatbot } from '@/components/AIDressChatbot';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Filter, X } from 'lucide-react';

interface Dress {
  id: string;
  name: string;
  description: string;
  size: string;
  color: string;
  price_per_day: number | null;
  image_url: string;
  is_available: boolean;
  condition: string | null;
  category: string | null;
  created_at: string;
}

const categories = [
  { id: 'all', label: 'All', emptyLabel: 'dresses', type: 'dress' },
  { id: 'white-dress', label: 'White Dress', emptyLabel: 'White Dresses', type: 'dress' },
  { id: 'classic-dress', label: 'Classic Dress', emptyLabel: 'Classic Dresses', type: 'dress' },
  { id: 'clutch', label: 'Clutch', emptyLabel: 'Clutches', type: 'accessory' },
  { id: 'scarf', label: 'Scarf', emptyLabel: 'Scarves', type: 'accessory' },
];

export default function Shop() {
  const [dresses, setDresses] = useState<Dress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  const formatColorName = (color: string) =>
    color
      .replace(/-/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const getFilterDescription = () => {
    const parts: string[] = [];
    const categoryInfo = categories.find((category) => category.id === selectedCategory);

    if (selectedCategory !== 'all' && categoryInfo) {
      parts.push(categoryInfo.emptyLabel || categoryInfo.label);
    }

    if (selectedColor !== 'all') {
      parts.push(`${formatColorName(selectedColor)} color`);
    }

    if (selectedCondition) {
      parts.push(selectedCondition === 'new' ? 'new condition' : 'pre-loved condition');
    }

    if (parts.length === 0) {
      return 'dresses';
    }

    if (parts.length === 1) {
      return parts[0];
    }

    if (parts.length === 2) {
      return `${parts[0]} and ${parts[1]}`;
    }

    return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
  };

  const getEmptyStateMessage = () => {
    const categoryInfo = categories.find((category) => category.id === selectedCategory);
    const categoryType = categoryInfo?.type || 'dress';
    const filterDesc = getFilterDescription();

    if (categoryType === 'accessory') {
      return {
        message: `We couldn't find any ${filterDesc} in this selection.`,
        subMessage: "If you're looking for something special, our designer can provide it upon request."
      };
    } else {
      return {
        message: `No matching ${filterDesc} at the moment.`,
        subMessage: "Need something unique? Our designer can create a custom look tailored for you."
      };
    }
  };

  // Save scroll position before navigating away
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
      sessionStorage.setItem('shopScrollPosition', window.scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Restore scroll position when coming back
  useEffect(() => {
    const savedPosition = sessionStorage.getItem('shopScrollPosition');
    if (savedPosition && !loading) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedPosition));
      }, 100);
    }
  }, [loading]);

  useEffect(() => {
    fetchDresses();
    fetchAvailableColors();
  }, []);

  useEffect(() => {
    fetchDresses();
  }, [selectedCategory, selectedColor, selectedCondition]);

  const fetchAvailableColors = async () => {
    try {
      const { data, error } = await supabase
        .from('dresses')
        .select('color')
        .not('color', 'is', null);

      if (error) throw error;

      const uniqueColors = [...new Set(data.map(d => d.color))].filter(Boolean);
      setAvailableColors(uniqueColors as string[]);
    } catch (error) {
      console.error('Error fetching colors:', error);
    }
  };

  const fetchDresses = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('dresses')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (selectedColor !== 'all') {
        query = query.ilike('color', selectedColor);
      }

      if (selectedCondition) {
        query = query.eq('condition', selectedCondition);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDresses(data || []);
    } catch (error) {
      console.error('Error fetching dresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedColor('all');
    setSelectedCondition(null);
  };

  const hasActiveFilters = selectedCategory !== 'all' || selectedColor !== 'all' || selectedCondition !== null;

  return (
    <div className="min-h-screen flex flex-col relative">
      <InteractiveBackground />
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-12 px-4">
        <div className="container mx-auto text-center relative z-10 max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 animate-fade-in">
            Shop Collection
          </h1>
          <p className="text-lg text-muted-foreground animate-fade-in">
            Explore our complete designer collection
          </p>
        </div>
      </section>

      <main className="flex-1 pb-12">
        <div className="container mx-auto px-4">
          {/* Filters Section */}
          <div className="mb-8">
            {/* Mobile Filter Toggle */}
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h2 className="text-2xl font-bold">All Products</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {[selectedCategory !== 'all', selectedColor !== 'all', selectedCondition].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </div>

          {/* Filters Panel */}
            <div className={`bg-background rounded-xl border-2 border-border p-6 mb-6 shadow-sm ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Filters</h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs h-8"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>

              {/* Category Pills */}
              <div className="mb-6">
                <label className="text-sm font-semibold mb-3 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all border-2 ${
                        selectedCategory === category.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:border-primary'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {/* Color Filter */}
                <div>
                  <label className="text-sm font-semibold mb-3 block">Color</label>
                  <Select value={selectedColor} onValueChange={setSelectedColor}>
                    <SelectTrigger className="w-full h-12 bg-background border-2 border-border hover:border-primary transition-colors">
                      <SelectValue placeholder="All Colors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Colors</SelectItem>
                      {availableColors.map((color) => (
                        <SelectItem key={color} value={color}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Condition Filter */}
                <div>
                  <label className="text-sm font-semibold mb-3 block">Condition</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        setSelectedCondition(selectedCondition === 'new' ? null : 'new')
                      }
                      className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all border-2 ${
                        selectedCondition === 'new'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:border-primary'
                      }`}
                    >
                      New
                    </button>
                    <button
                      onClick={() =>
                        setSelectedCondition(selectedCondition === 'used' ? null : 'used')
                      }
                      className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all border-2 ${
                        selectedCondition === 'used'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:border-primary'
                      }`}
                    >
                      Used
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="w-full h-[421px] bg-muted" />
                    <div className="p-4 h-[60px] flex items-center justify-center">
                      <div className="h-6 bg-muted/80 rounded w-3/4" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : dresses.length === 0 ? (
              <div className="text-center py-20 animate-fade-in">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Filter className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-lg mb-2">
                  {getEmptyStateMessage().message}
                </p>
                <p className="text-muted-foreground text-base mb-4">
                  {getEmptyStateMessage().subMessage}
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {dresses.length} {dresses.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {dresses.map((dress, index) => (
                    <div
                      key={dress.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <DressCard
                        id={dress.id}
                        name={dress.name}
                        image_url={dress.image_url}
                        is_available={dress.is_available}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <AIDressChatbot />
    </div>
  );
}
