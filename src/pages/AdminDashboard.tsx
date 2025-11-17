import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Upload } from 'lucide-react';
import { z } from 'zod';

const dressSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }).max(100),
  description: z.string().trim().max(500),
  size: z.string().trim().min(1, { message: "Size is required" }),
  color: z.string().trim().min(1, { message: "Color is required" }),
  price_per_day: z.number().min(0, { message: "Price must be positive" }),
});

interface Dress {
  id: string;
  name: string;
  description: string;
  size: string;
  color: string;
  price_per_day: number;
  image_url: string;
  is_available: boolean;
}

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dresses, setDresses] = useState<Dress[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    size: '',
    color: '',
    price_per_day: '',
  });

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchDresses();
    }
  }, [user, isAdmin]);

  const fetchDresses = async () => {
    try {
      const { data, error } = await supabase
        .from('dresses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDresses(data || []);
    } catch (error) {
      console.error('Error fetching dresses:', error);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('dress-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('dress-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = dressSchema.safeParse({
      ...formData,
      price_per_day: parseFloat(formData.price_per_day),
    });

    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    if (!imageFile) {
      toast({
        title: "Image required",
        description: "Please select an image for the dress",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const imageUrl = await uploadImage(imageFile);

      const { error } = await supabase
        .from('dresses')
        .insert([{
          name: validation.data.name,
          description: validation.data.description,
          size: validation.data.size,
          color: validation.data.color,
          price_per_day: validation.data.price_per_day,
          image_url: imageUrl,
        }]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Dress added successfully",
      });

      setFormData({
        name: '',
        description: '',
        size: '',
        color: '',
        price_per_day: '',
      });
      setImageFile(null);
      fetchDresses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('dresses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Dress removed successfully",
      });

      fetchDresses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add New Dress Form */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Add New Dress</CardTitle>
              <CardDescription>Upload a new dress to the collection</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Dress Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Size (e.g., S, M, L)"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    required
                  />
                </div>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Price per day"
                  value={formData.price_per_day}
                  onChange={(e) => setFormData({ ...formData, price_per_day: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Dress Image
                  </label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  <Upload className="w-4 h-4 mr-2" />
                  {loading ? 'Adding...' : 'Add Dress'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Existing Dresses List */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Manage Dresses</CardTitle>
              <CardDescription>View and manage existing dresses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {dresses.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No dresses added yet
                  </p>
                ) : (
                  dresses.map((dress) => (
                    <div key={dress.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <img
                        src={dress.image_url}
                        alt={dress.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{dress.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ${dress.price_per_day}/day - {dress.size} - {dress.color}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(dress.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
