import { getSupabaseAdmin } from "@/lib/supabase";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";

export async function GET() {
  try {
    const supabaseAuth = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, tier_key, tier_label, total, status, name, nim, email, discount_code, discount_percent, created_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch orders", error);
      return Response.json({ error: "Failed to load orders" }, { status: 500 });
    }

    return Response.json({ orders: data ?? [] });
  } catch (error) {
    console.error("Orders GET error", error);
    return Response.json({ error: "Server misconfiguration" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    const id = String(payload?.id ?? "");
    const tierKey = String(payload?.tierKey ?? "").toLowerCase();
    const tierLabel = String(payload?.tierLabel ?? "");
    const total = Number(payload?.total ?? NaN);
    const status = (payload?.status ?? "pending") as string;
    const name = String(payload?.name ?? "").trim();
    const nim = String(payload?.nim ?? "").trim();
    const email = String(payload?.email ?? "").trim();
    const discountCode = payload?.discountCode
      ? String(payload.discountCode).toUpperCase()
      : null;
    const discountPercent = payload?.discountPercent
      ? Number(payload.discountPercent)
      : 0;

    if (!id) {
      return Response.json(
        { error: "Missing order identifier" },
        { status: 400 },
      );
    }

    if (!name || !nim || !email) {
      return Response.json(
        { error: "Name, NIM, and email are required" },
        { status: 400 },
      );
    }

    if (Number.isNaN(total) || total < 0) {
      return Response.json(
        { error: "Total must be a positive number" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("orders")
      .insert({
        id,
        tier_key: tierKey,
        tier_label: tierLabel,
        total,
        status,
        name,
        nim,
        email,
        discount_code: discountCode,
        discount_percent: discountPercent,
      })
      .select(
        "id, tier_key, tier_label, total, status, name, nim, email, discount_code, discount_percent, created_at",
      )
      .single();

    if (error) {
      console.error("Failed to create order", error);
      return Response.json(
        { error: "Failed to create order" },
        { status: 500 },
      );
    }

    return Response.json({ order: data }, { status: 201 });
  } catch (error) {
    console.error("Orders POST error", error);
    return Response.json({ error: "Server misconfiguration" }, { status: 500 });
  }
}
