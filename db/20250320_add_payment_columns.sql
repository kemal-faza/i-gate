-- Add Midtrans payment metadata to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_id uuid,
  ADD COLUMN IF NOT EXISTS gross_amount integer,
  ADD COLUMN IF NOT EXISTS payment_type text,
  ADD COLUMN IF NOT EXISTS transaction_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS midtrans_payload jsonb;

-- Ensure legacy rows have order_id and gross_amount populated
UPDATE public.orders
SET order_id = id
WHERE order_id IS NULL;

UPDATE public.orders
SET gross_amount = total
WHERE gross_amount IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_type ON public.orders (payment_type);
