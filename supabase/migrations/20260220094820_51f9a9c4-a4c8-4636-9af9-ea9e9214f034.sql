
-- Create order status enum
CREATE TYPE public.order_status AS ENUM ('pending', 'delivered', 'returned');

-- Add purchase_price column to dresses
ALTER TABLE public.dresses ADD COLUMN purchase_price numeric NULL;

-- Create abaya stock table (per size)
CREATE TABLE public.abaya_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dress_id uuid NOT NULL REFERENCES public.dresses(id) ON DELETE CASCADE,
  size text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(dress_id, size)
);

ALTER TABLE public.abaya_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stock" ON public.abaya_stock FOR SELECT USING (true);
CREATE POLICY "Admins can insert stock" ON public.abaya_stock FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update stock" ON public.abaya_stock FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete stock" ON public.abaya_stock FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_abaya_stock_updated_at
  BEFORE UPDATE ON public.abaya_stock
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create orders table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dress_id uuid NOT NULL REFERENCES public.dresses(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text NOT NULL,
  customer_address text NOT NULL,
  selected_size text NOT NULL,
  notes text,
  status order_status NOT NULL DEFAULT 'pending',
  quantity integer NOT NULL DEFAULT 1,
  total_price numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view orders" ON public.orders FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can place orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
