
-- Drop the restrictive INSERT policy and recreate as permissive
DROP POLICY IF EXISTS "Anyone can place orders" ON public.orders;

CREATE POLICY "Anyone can place orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
