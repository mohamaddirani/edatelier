import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';

interface StockEntry {
  id: string;
  size: string;
  quantity: number;
}

interface AdminStockManagerProps {
  dressId: string;
}

export default function AdminStockManager({ dressId }: AdminStockManagerProps) {
  const { toast } = useToast();
  const [stock, setStock] = useState<StockEntry[]>([]);
  const [newSize, setNewSize] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStock();
  }, [dressId]);

  const fetchStock = async () => {
    const { data, error } = await supabase
      .from('abaya_stock')
      .select('*')
      .eq('dress_id', dressId)
      .order('size');

    if (!error && data) setStock(data);
  };

  const addSize = async () => {
    if (!newSize.trim() || !newQuantity) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('abaya_stock')
        .insert({
          dress_id: dressId,
          size: newSize.trim().toUpperCase(),
          quantity: parseInt(newQuantity) || 0,
        });

      if (error) throw error;
      setNewSize('');
      setNewQuantity('');
      fetchStock();
      toast({ title: "Size added" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    const { error } = await supabase
      .from('abaya_stock')
      .update({ quantity: Math.max(0, quantity) })
      .eq('id', id);

    if (!error) fetchStock();
  };

  const deleteSize = async (id: string) => {
    const { error } = await supabase
      .from('abaya_stock')
      .delete()
      .eq('id', id);

    if (!error) fetchStock();
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">Stock per Size</label>
      {stock.map((entry) => (
        <div key={entry.id} className="flex items-center gap-2">
          <span className="w-16 text-sm font-medium">{entry.size}</span>
          <Input
            type="number"
            min="0"
            value={entry.quantity}
            onChange={(e) => updateQuantity(entry.id, parseInt(e.target.value) || 0)}
            className="w-24"
          />
          <Button variant="ghost" size="icon" onClick={() => deleteSize(entry.id)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Size (e.g. M)"
          value={newSize}
          onChange={(e) => setNewSize(e.target.value)}
          className="w-24"
        />
        <Input
          type="number"
          placeholder="Qty"
          value={newQuantity}
          onChange={(e) => setNewQuantity(e.target.value)}
          className="w-24"
        />
        <Button variant="outline" size="sm" onClick={addSize} disabled={loading}>
          <Plus className="w-3 h-3 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
}
