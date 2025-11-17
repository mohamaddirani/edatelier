import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DressCard from '@/components/DressCard';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

      // Apply category filter
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      // Apply color filter
      if (selectedColor !== 'all') {
        query = query.ilike('color', selectedColor);
      }

      // Apply condition filter
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Shop Collection</h1>
            <p className="text-muted-foreground">
              Browse our complete collection of elegant dresses
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-lg border border-border p-6 sticky top-24">
                <h2 className="text-xl font-semibold mb-6">Filters</h2>

                {/* Color Filter */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Filter by Color</h3>
                  <Select value={selectedColor} onValueChange={setSelectedColor}>
                    <SelectTrigger>
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
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Condition</h3>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedCondition === 'new' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        setSelectedCondition(selectedCondition === 'new' ? null : 'new')
                      }
                      className="flex-1"
                    >
                      New
                    </Button>
                    <Button
                      variant={selectedCondition === 'used' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        setSelectedCondition(selectedCondition === 'used' ? null : 'used')
                      }
                      className="flex-1"
                    >
                      Used
                    </Button>
                  </div>
                </div>

                {/* Clear Filters */}
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Products Grid */}
            <div className="lg:col-span-3">
              {/* Category Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(category.id)}
                    className="whitespace-nowrap"
                  >
                    {category.label}
                  </Button>
                ))}
              </div>

              <h2 className="text-2xl font-semibold mb-6">All Products</h2>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-[400px] bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : dresses.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg">
                    No dresses found with the selected filters.
                  </p>
                  <Button onClick={clearFilters} variant="outline" className="mt-4">
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dresses.map((dress) => (
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
