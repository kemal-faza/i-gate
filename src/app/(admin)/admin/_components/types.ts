export type ID = string;

export type Currency = "USD" | "IDR";

export type Provider = "stripe";

export type OrderStatus = "pending" | "paid" | "failed" | "refunded";

export type TicketStatus = "valid" | "used" | "void";

export interface Customer {
  id: ID;
  email: string;
  name: string;
  nim: string;
  created_at: string; // ISO
}

export interface Order {
  id: ID;
  customer_id: ID;
  amount: number;
  currency: Currency;
  provider: Provider;
  provider_payment_id: string;
  status: OrderStatus;
  created_at: string; // ISO
}

export interface Event {
  id: ID;
  name: string;
  starts_at: string; // ISO
  venue: string;
}

export interface Ticket {
  id: ID;
  order_uuid: ID;
  ticket_code: string; // UUID v4
  event_id: ID;
  qr_image_url?: string; // placeholder or data URL
  status: TicketStatus;
  issued_at: string; // ISO
  used_at?: string | null; // ISO or null
}

// Convenience row types with denormalized labels for tables (mock only)
export interface OrderRow extends Order {
  customer_name?: string;
  customer_email?: string;
}

export interface TicketRow extends Ticket {
  event_name?: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
}
