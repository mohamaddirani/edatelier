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
import { Trash2, Upload, Pencil } from 'lucide-react';
import { z } from 'zod';

const dressSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }).max(100),
  description: z.string().trim().max(500),
  size: z.string().trim().min(1, { message: "Size is required" }),
  color: z.string().trim().min(1, { message: "Color is required" }),
  price_per_day: z.number().min(0, { message: "Price must be positive" }).optional(),
  condition: z.enum(['new', 'used'], { message: "Please select a condition" }),
  category: z.string().trim().min(1, { message: "Category is required" }),
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
  condition: string | null;
  category: string | null;
}

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dresses, setDresses] = useState<Dress[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [editingDressId, setEditingDressId] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<Array<{
    id: string;
    image_url: string;
    is_primary: boolean;
    display_order: number;
  }>>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    size: '',
    color: '',
    price_per_day: '',
    condition: 'new' as 'new' | 'used',
    category: 'dress',
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
    
    const priceValue = formData.price_per_day ? parseFloat(formData.price_per_day) : undefined;
    
    const validation = dressSchema.safeParse({
      ...formData,
      price_per_day: priceValue,
    });

    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    // When editing, images are optional (can keep existing ones)
    if (!editingDressId && imageFiles.length === 0) {
      toast({
        title: "Image required",
        description: "Please select at least one image for the dress",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (editingDressId) {
        // UPDATE EXISTING DRESS
        
        // Delete marked images
        if (imagesToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('dress_images')
            .delete()
            .in('id', imagesToDelete);
          if (deleteError) throw deleteError;
        }

        // Upload new images if any
        let newImageUrls: string[] = [];
        if (imageFiles.length > 0) {
          newImageUrls = await Promise.all(imageFiles.map(file => uploadImage(file)));
        }

        // Determine primary image
        const remainingExistingImages = existingImages.filter(img => !imagesToDelete.includes(img.id));
        const totalImages = remainingExistingImages.length + newImageUrls.length;
        
        let primaryImageUrl = '';
        if (primaryImageIndex < remainingExistingImages.length) {
          // Primary is an existing image
          primaryImageUrl = remainingExistingImages[primaryImageIndex].image_url;
        } else {
          // Primary is a new image
          const newImageIndex = primaryImageIndex - remainingExistingImages.length;
          primaryImageUrl = newImageUrls[newImageIndex] || remainingExistingImages[0]?.image_url || '';
        }

        // Update dress record
        const { error: dressError } = await supabase
          .from('dresses')
          .update({
            name: validation.data.name,
            description: validation.data.description,
            size: validation.data.size,
            color: validation.data.color,
            price_per_day: validation.data.price_per_day,
            condition: validation.data.condition,
            category: validation.data.category,
            image_url: primaryImageUrl,
          })
          .eq('id', editingDressId);

        if (dressError) throw dressError;

        // Update is_primary for existing images
        if (remainingExistingImages.length > 0) {
          for (const img of remainingExistingImages) {
            const isPrimary = img.image_url === primaryImageUrl;
            await supabase
              .from('dress_images')
              .update({ is_primary: isPrimary })
              .eq('id', img.id);
          }
        }

        // Insert new images
        if (newImageUrls.length > 0) {
          const imageRecords = newImageUrls.map((url, index) => ({
            dress_id: editingDressId,
            image_url: url,
            is_primary: url === primaryImageUrl,
            display_order: remainingExistingImages.length + index,
          }));

          const { error: imagesError } = await supabase
            .from('dress_images')
            .insert(imageRecords);

          if (imagesError) throw imagesError;
        }

        toast({
          title: "Success!",
          description: "Dress updated successfully",
        });
      } else {
        // CREATE NEW DRESS
        
        // Upload all images
        const imageUrls = await Promise.all(imageFiles.map(file => uploadImage(file)));

        // Insert dress record
        const { data: dressData, error: dressError } = await supabase
          .from('dresses')
          .insert([{
            name: validation.data.name,
            description: validation.data.description,
            size: validation.data.size,
            color: validation.data.color,
            price_per_day: validation.data.price_per_day,
            condition: validation.data.condition,
            category: validation.data.category,
            image_url: imageUrls[primaryImageIndex],
          }])
          .select()
          .single();

        if (dressError) throw dressError;

        // Insert all images into dress_images table
        const imageRecords = imageUrls.map((url, index) => ({
          dress_id: dressData.id,
          image_url: url,
          is_primary: index === primaryImageIndex,
          display_order: index,
        }));

        const { error: imagesError } = await supabase
          .from('dress_images')
          .insert(imageRecords);

        if (imagesError) throw imagesError;

        toast({
          title: "Success!",
          description: "Dress added successfully",
        });
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        size: '',
        color: '',
        price_per_day: '',
        condition: 'new',
        category: 'dress',
      });
      setImageFiles([]);
      setPrimaryImageIndex(0);
      setEditingDressId(null);
      setExistingImages([]);
      setImagesToDelete([]);
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

  const handleEdit = async (dress: Dress) => {
    setEditingDressId(dress.id);
    setFormData({
      name: dress.name,
      description: dress.description || '',
      size: dress.size || '',
      color: dress.color || '',
      price_per_day: dress.price_per_day?.toString() || '',
      condition: (dress.condition as 'new' | 'used') || 'new',
      category: dress.category || 'dress',
    });

    // Fetch existing images
    try {
      const { data, error } = await supabase
        .from('dress_images')
        .select('*')
        .eq('dress_id', dress.id)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setExistingImages(data);
        const primaryIndex = data.findIndex(img => img.is_primary);
        setPrimaryImageIndex(primaryIndex >= 0 ? primaryIndex : 0);
      } else {
        // No images in dress_images table, use legacy image
        setExistingImages([{
          id: 'legacy',
          image_url: dress.image_url || '',
          is_primary: true,
          display_order: 0,
        }]);
        setPrimaryImageIndex(0);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: "Error",
        description: "Failed to load dress images",
        variant: "destructive",
      });
    }

    setImageFiles([]);
    setImagesToDelete([]);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingDressId(null);
    setFormData({
      name: '',
      description: '',
      size: '',
      color: '',
      price_per_day: '',
      condition: 'new',
      category: 'dress',
    });
    setImageFiles([]);
    setExistingImages([]);
    setImagesToDelete([]);
    setPrimaryImageIndex(0);
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
    return <main className="min-h-screen flex items-center justify-center">Loading...</main>;
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-32 pb-20">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add New Dress Form */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>{editingDressId ? 'Edit Dress' : 'Add New Dress'}</CardTitle>
              <CardDescription>
                {editingDressId ? 'Update dress information and images' : 'Upload a new dress to the collection'}
              </CardDescription>
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
                  placeholder="Price per day (optional)"
                  value={formData.price_per_day}
                  onChange={(e) => setFormData({ ...formData, price_per_day: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Condition</label>
                    <select
                      value={formData.condition}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value as 'new' | 'used' })}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      required
                    >
                      <option value="new">New</option>
                      <option value="used">Used</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      required
                    >
                      <option value="dress">Dress</option>
                      <option value="white-dress">White Dress</option>
                      <option value="classic-dress">Classic Dress</option>
                      <option value="clutch">Clutch</option>
                      <option value="scarf">Scarf</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Dress Images
                  </label>
                  
                  {/* Existing Images */}
                  {existingImages.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-muted-foreground mb-2">
                        Current images (click to set as primary, click X to remove):
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {existingImages.map((img, index) => (
                          <div key={img.id} className="relative">
                            <button
                              type="button"
                              onClick={() => setPrimaryImageIndex(index)}
                              className={`relative w-16 h-16 rounded border-2 overflow-hidden ${
                                index === primaryImageIndex && imagesToDelete.indexOf(img.id) === -1
                                  ? 'border-primary ring-2 ring-primary' 
                                  : 'border-border'
                              } ${imagesToDelete.includes(img.id) ? 'opacity-30' : ''}`}
                            >
                              <img
                                src={img.image_url}
                                alt={`Existing ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {index === primaryImageIndex && !imagesToDelete.includes(img.id) && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                  <span className="text-xs font-bold text-primary-foreground bg-primary px-1 rounded">
                                    Primary
                                  </span>
                                </div>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (imagesToDelete.includes(img.id)) {
                                  setImagesToDelete(imagesToDelete.filter(id => id !== img.id));
                                } else {
                                  setImagesToDelete([...imagesToDelete, img.id]);
                                }
                              }}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/80"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* New Images Upload */}
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setImageFiles(files);
                      if (files.length > 0 && existingImages.length === 0) {
                        setPrimaryImageIndex(0);
                      }
                    }}
                    required={!editingDressId && existingImages.length === 0}
                  />
                  {imageFiles.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-2">
                        {imageFiles.length} new image(s) selected:
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {imageFiles.map((file, index) => {
                          const globalIndex = existingImages.filter(img => !imagesToDelete.includes(img.id)).length + index;
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setPrimaryImageIndex(globalIndex)}
                              className={`relative w-16 h-16 rounded border-2 overflow-hidden ${
                                globalIndex === primaryImageIndex 
                                  ? 'border-primary ring-2 ring-primary' 
                                  : 'border-border'
                              }`}
                            >
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {globalIndex === primaryImageIndex && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                  <span className="text-xs font-bold text-primary-foreground bg-primary px-1 rounded">
                                    Primary
                                  </span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    <Upload className="w-4 h-4 mr-2" />
                    {loading ? (editingDressId ? 'Updating...' : 'Adding...') : (editingDressId ? 'Update Dress' : 'Add Dress')}
                  </Button>
                  {editingDressId && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={loading}>
                      Cancel
                    </Button>
                  )}
                </div>
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
                          {dress.price_per_day ? `$${dress.price_per_day}/day - ` : ''}{dress.size} - {dress.color}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(dress)}
                          title="Edit dress"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(dress.id)}
                          title="Delete dress"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
