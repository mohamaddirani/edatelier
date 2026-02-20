import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, CheckCircle } from 'lucide-react';
import { z } from 'zod';

const orderSchema = z.object({
  customer_name: z.string().trim().min(1, "Name is required").max(100),
  customer_phone: z.string().trim().min(1, "Phone is required").max(30),
  customer_email: z.string().trim().email("Invalid email").max(255),
  customer_address: z.string().trim().min(1, "Address is required").max(500),
  selected_size: z.string().trim().min(1, "Please select a size"),
  notes: z.string().trim().max(500).optional(),
});

interface OrderFormProps {
  dressId: string;
  dressName: string;
  purchasePrice: number | null;
  availableSizes: { size: string; quantity: number }[];
}

export default function OrderForm({ dressId, dressName, purchasePrice, availableSizes }: OrderFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    selected_size: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = orderSchema.safeParse(formData);
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    // Check stock availability
    const selectedStock = availableSizes.find(s => s.size === formData.selected_size);
    if (!selectedStock || selectedStock.quantity <= 0) {
      toast({
        title: "Out of Stock",
        description: "This size is currently out of stock.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Insert order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          dress_id: dressId,
          customer_name: validation.data.customer_name,
          customer_phone: validation.data.customer_phone,
          customer_email: validation.data.customer_email,
          customer_address: validation.data.customer_address,
          selected_size: validation.data.selected_size,
          notes: validation.data.notes || null,
          quantity: 1,
          total_price: purchasePrice,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Send confirmation emails (fire and forget)
      supabase.functions.invoke('send-order-email', {
        body: { orderId: order.id },
      }).catch(err => console.error('Email sending failed:', err));

      setOrderPlaced(true);
      toast({
        title: "Order Placed!",
        description: "You'll receive a confirmation email shortly.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <Card className="border-primary/20">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Order Placed Successfully!</h3>
          <p className="text-muted-foreground">
            A confirmation email has been sent to your email address. We'll contact you shortly for delivery details.
          </p>
        </CardContent>
      </Card>
    );
  }

  const inStockSizes = availableSizes.filter(s => s.quantity > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          Place Your Order
        </CardTitle>
      </CardHeader>
      <CardContent>
        {inStockSizes.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            This item is currently out of stock. Please check back later.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Size *</label>
              <select
                value={formData.selected_size}
                onChange={(e) => setFormData({ ...formData, selected_size: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                required
              >
                <option value="">Select a size</option>
                {inStockSizes.map(({ size, quantity }) => (
                  <option key={size} value={size}>
                    {size} ({quantity} available)
                  </option>
                ))}
              </select>
            </div>
            <Input
              placeholder="Full Name *"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              required
            />
            <Input
              type="email"
              placeholder="Email Address *"
              value={formData.customer_email}
              onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
              required
            />
            <Input
              placeholder="Phone Number *"
              value={formData.customer_phone}
              onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              required
            />
            <Textarea
              placeholder="Shipping Address *"
              value={formData.customer_address}
              onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
              rows={2}
              required
            />
            <Textarea
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              <ShoppingBag className="w-4 h-4 mr-2" />
              {loading ? 'Placing Order...' : `Buy Now${purchasePrice ? ` - $${purchasePrice}` : ''}`}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
