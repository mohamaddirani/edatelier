import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DressCard from '@/components/DressCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  { id: 'all', label: 'All' },
  { id: 'white-dress', label: 'White Dress' },
  { id: 'classic-dress', label: 'Classic Dress' },
  { id: 'clutch', label: 'Clutch' },
  { id: 'scarf', label: 'Scarf' },
];

export default function Shop() {
  const [dresses, setDresses] = useState<Dress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

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
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-12 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
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
            <div className={`bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-6 mb-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              {/* Category Pills */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Categories</label>
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
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedCategory === category.id
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                          : 'bg-muted/50 text-foreground hover:bg-muted'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Color Filter */}
                <div>
                  <label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 block">Color</label>
                  <Select value={selectedColor} onValueChange={setSelectedColor}>
                    <SelectTrigger className="w-full h-11 bg-background border-border/50">
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
                  <label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 block">Condition</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setSelectedCondition(selectedCondition === 'new' ? null : 'new')
                      }
                      className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        selectedCondition === 'new'
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                          : 'bg-muted/50 text-foreground hover:bg-muted'
                      }`}
                    >
                      New
                    </button>
                    <button
                      onClick={() =>
                        setSelectedCondition(selectedCondition === 'used' ? null : 'used')
                      }
                      className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        selectedCondition === 'used'
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                          : 'bg-muted/50 text-foreground hover:bg-muted'
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
                  <div key={i} className="h-[400px] bg-muted/50 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : dresses.length === 0 ? (
              <div className="text-center py-20 animate-fade-in">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Filter className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-lg mb-4">
                  No dresses found with the selected filters
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
    </div>
  );
}
