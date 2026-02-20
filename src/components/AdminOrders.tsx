import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Package, Truck, RotateCcw } from 'lucide-react';

interface Order {
  id: string;
  dress_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  selected_size: string;
  notes: string | null;
  status: string;
  quantity: number;
  total_price: number | null;
  created_at: string;
  dresses?: { name: string } | null;
}

export default function AdminOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, dresses(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: 'pending' | 'delivered' | 'returned', dressId: string, selectedSize: string) => {
    setUpdating(orderId);
    try {
      const currentOrder = orders.find(o => o.id === orderId);
      const wasDelivered = currentOrder?.status === 'delivered';

      // Update order status
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Decrease stock when marking as delivered (only if not already delivered)
      if (newStatus === 'delivered' && !wasDelivered) {
        const { data: stock } = await supabase
          .from('abaya_stock')
          .select('id, quantity')
          .eq('dress_id', dressId)
          .eq('size', selectedSize)
          .single();

        if (stock && stock.quantity > 0) {
          await supabase
            .from('abaya_stock')
            .update({ quantity: stock.quantity - 1 })
            .eq('id', stock.id);
        }
      }
      // "returned" status does NOT restore quantity (as per requirements)

      toast({
        title: "Status Updated",
        description: `Order marked as ${newStatus}`,
      });

      fetchOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-accent/50 text-accent-foreground border-accent">Pending</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Delivered</Badge>;
      case 'returned':
        return <Badge variant="outline" className="bg-secondary text-secondary-foreground border-border">Returned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <p className="text-muted-foreground text-center py-8">Loading orders...</p>;
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Orders Management
        </CardTitle>
        <CardDescription>View and manage customer orders</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[700px] overflow-y-auto">
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No orders yet</p>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{order.dresses?.name || 'Unknown Item'}</h4>
                    <p className="text-xs text-muted-foreground">
                      Order #{order.id.slice(0, 8)} • {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Customer:</span> {order.customer_name}</div>
                  <div><span className="font-medium">Phone:</span> {order.customer_phone}</div>
                  <div><span className="font-medium">Email:</span> {order.customer_email}</div>
                  <div><span className="font-medium">Size:</span> {order.selected_size}</div>
                  <div className="col-span-2"><span className="font-medium">Address:</span> {order.customer_address}</div>
                  {order.notes && (
                    <div className="col-span-2"><span className="font-medium">Notes:</span> {order.notes}</div>
                  )}
                  {order.total_price && (
                    <div><span className="font-medium">Total:</span> ${order.total_price}</div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  {order.status !== 'delivered' && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'delivered', order.dress_id, order.selected_size)}
                      disabled={updating === order.id}
                    >
                      <Truck className="w-3 h-3 mr-1" />
                      Mark Delivered
                    </Button>
                  )}
                  {order.status !== 'returned' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateOrderStatus(order.id, 'returned', order.dress_id, order.selected_size)}
                      disabled={updating === order.id}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Mark Returned
                    </Button>
                  )}
                  {order.status !== 'pending' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateOrderStatus(order.id, 'pending', order.dress_id, order.selected_size)}
                      disabled={updating === order.id}
                    >
                      Reset to Pending
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
