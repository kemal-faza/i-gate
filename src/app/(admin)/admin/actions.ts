"use server";

import { getSupabaseAdmin } from "@/lib/supabase";

export type OrderRow = {
  id: string;
  tierKey: string;
  tierLabel: string;
  total: number;
  grossAmount: number | null;
  paymentType: string | null;
  status: string;
  name: string;
  nim: string;
  email: string;
  discountCode: string | null;
  discountPercent: number;
  createdAt: string;
};

export type DiscountRow = {
  id: string;
  code: string;
  percentOff: number;
  description: string | null;
  active: boolean;
  maxUses: number | null;
  usageCount: number | null;
  expiresAt: string | null;
  createdAt: string;
};

export type AttendanceRow = {
  id: string;
  ticketCode: string;
  attendeeName: string | null;
  checkedInAt: string;
  checkedInBy: string | null;
};

export async function fetchOrdersAction(
  page: number,
  pageSize: number,
): Promise<{
  rows: OrderRow[];
  total: number;
  pending: number;
  revenue: number;
}> {
  const supabase = getSupabaseAdmin();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const [
    { data, error, count },
    { count: pendingCount, error: pendingError },
    { data: revenueData, error: revenueError },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, tier_key, tier_label, total, gross_amount, payment_type, status, name, nim, email, discount_code, discount_percent, created_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("orders")
      .select("gross_amount,total", { head: false })
      .eq("status", "paid"),
  ]);

  if (error) {
    console.error("fetchOrdersAction error", error);
    throw new Error("Failed to fetch orders");
  }

  if (pendingError) {
    console.error("fetchOrdersAction pending count error", pendingError);
  }

  if (revenueError) {
    console.error("fetchOrdersAction revenue error", revenueError);
  }

  const revenueList = (revenueData ?? []) as Array<{
    gross_amount: number | null;
    total: number | null;
  }>;

  const revenue = revenueList.reduce((sum, row) => {
    const gross = Number(row.gross_amount);
    const fallback = Number(row.total);
    if (Number.isFinite(gross)) return sum + gross;
    if (Number.isFinite(fallback)) return sum + fallback;
    return sum;
  }, 0);

  return {
    rows:
      data?.map((row) => ({
        id: row.id,
        tierKey: row.tier_key,
        tierLabel: row.tier_label,
        total: row.total,
        grossAmount: row.gross_amount,
        paymentType: row.payment_type,
        status: row.status,
        name: row.name,
        nim: row.nim,
        email: row.email,
        discountCode: row.discount_code,
        discountPercent: row.discount_percent,
        createdAt: row.created_at,
      })) ?? [],
    total: count ?? 0,
    pending: pendingCount ?? 0,
    revenue,
  };
}

export async function fetchDiscountsAction(
  page: number,
  pageSize: number,
): Promise<{ rows: DiscountRow[]; total: number; active: number }> {
  const supabase = getSupabaseAdmin();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const [{ data, error, count }, { count: activeCount, error: activeError }] =
    await Promise.all([
      supabase
        .from("discount_codes")
        .select(
          "id, code, percent_off, description, active, max_uses, usage_count, expires_at, created_at",
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(from, to),
      supabase
        .from("discount_codes")
        .select("id", { count: "exact", head: true })
        .eq("active", true),
    ]);

  if (error) {
    console.error("fetchDiscountsAction error", error);
    throw new Error("Failed to fetch discounts");
  }

  if (activeError) {
    console.error("fetchDiscountsAction active count error", activeError);
  }

  return {
    rows:
      data?.map((row) => ({
        id: row.id,
        code: row.code,
        percentOff: row.percent_off,
        description: row.description,
        active: row.active,
        maxUses: row.max_uses,
        usageCount: row.usage_count,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
      })) ?? [],
    total: count ?? 0,
    active: activeCount ?? 0,
  };
}

export async function fetchAttendancesAction(
  page: number,
  pageSize: number,
): Promise<{ rows: AttendanceRow[]; total: number }> {
  const supabase = getSupabaseAdmin();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("event")
    .select("id, ticket_code, attendee_name, checked_in_at, checked_in_by", {
      count: "exact",
    })
    .order("checked_in_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("fetchAttendancesAction error", error);
    throw new Error("Failed to fetch attendance records");
  }

  return {
    rows:
      data?.map((row) => ({
        id: row.id,
        ticketCode: row.ticket_code,
        attendeeName: row.attendee_name,
        checkedInAt: row.checked_in_at,
        checkedInBy: row.checked_in_by,
      })) ?? [],
    total: count ?? 0,
  };
}
