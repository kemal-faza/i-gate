-- Attendance table for ticket check-in
CREATE TABLE IF NOT EXISTS public.event (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  ticket_code text NOT NULL,
  attendee_name text,
  checked_in_by text,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS event_order_unique ON public.event(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS event_ticket_code_unique ON public.event(ticket_code);
CREATE INDEX IF NOT EXISTS event_checked_in_at_idx ON public.event(checked_in_at DESC);
