-- Enable UUID helpers (safe to run repeatedly)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Discount codes master table
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code          text UNIQUE NOT NULL,
  percent_off   integer NOT NULL CHECK (percent_off BETWEEN 0 AND 100),
  description   text,
  active        boolean NOT NULL DEFAULT TRUE,
  max_uses      integer,
  usage_count   integer NOT NULL DEFAULT 0,
  expires_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON public.discount_codes (active);
CREATE INDEX IF NOT EXISTS idx_discount_codes_created_at ON public.discount_codes (created_at DESC);

-- Orders captured from the ticket checkout flow
CREATE TABLE IF NOT EXISTS public.orders (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier_key          text NOT NULL,
  tier_label        text NOT NULL,
  total             integer NOT NULL,
  status            text NOT NULL,
  name              text NOT NULL,
  nim               text NOT NULL,
  email             text NOT NULL,
  discount_code     text REFERENCES public.discount_codes(code),
  discount_percent  integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_discount_code ON public.orders (discount_code);

-- Seed a few discount codes
INSERT INTO public.discount_codes (code, percent_off, description, active, max_uses, usage_count, expires_at)
VALUES
  ('EARLYBIRD', 20, 'Opening promo – limited seats', TRUE, 150, 0, now() + interval '30 days'),
  ('STUDENT10', 10, 'Student discount (no max uses)', TRUE, NULL, 0, NULL),
  ('VIPONLY',   50, 'Invite-only VIP offer', FALSE, 10, 0, now() + interval '7 days')
ON CONFLICT (code) DO NOTHING;

-- Seed a couple of example orders
INSERT INTO public.orders (id, tier_key, tier_label, total, status, name, nim, email, discount_code, discount_percent)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'regular', 'Regular', 90000,  'pending', 'Adi Nugraha',     '210123456', 'adi@example.com',      'STUDENT10', 10),
  ('00000000-0000-0000-0000-000000000102', 'vip',     'VIP',     250000, 'paid',    'Siti Rahmawati', '210987654', 'siti.rahma@example.com', NULL,         0),
  ('00000000-0000-0000-0000-000000000103', 'vvip',    'VVIP',    250000, 'pending', 'Budi Santoso',   '210555444', 'budi@example.com',      'EARLYBIRD',  20)
ON CONFLICT (id) DO NOTHING;

-- Optional: sync usage_count with existing orders
UPDATE public.discount_codes dc
SET usage_count = sub.usage_count
FROM (
  SELECT discount_code, COUNT(*)::int AS usage_count
  FROM public.orders
  WHERE discount_code IS NOT NULL
  GROUP BY discount_code
) AS sub
WHERE dc.code = sub.discount_code;
