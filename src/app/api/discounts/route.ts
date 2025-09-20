import { getSupabaseAdmin } from "@/lib/supabase";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("discount_codes")
      .select(
        "id, code, percent_off, description, active, max_uses, usage_count, expires_at, created_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch discount codes", error);
      return Response.json(
        { error: "Failed to load discounts" },
        { status: 500 },
      );
    }

    return Response.json({ discounts: data ?? [] });
  } catch (error) {
    console.error("Discounts GET error", error);
    return Response.json({ error: "Server misconfiguration" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabaseAuth = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    const code = String(payload?.code ?? "")
      .trim()
      .toUpperCase();
    const percentOff = Number(payload?.percentOff ?? NaN);
    const description = payload?.description
      ? String(payload.description).trim()
      : null;
    const maxUses = payload?.maxUses ? Number(payload.maxUses) : null;
    const expiresAt = payload?.expiresAt
      ? new Date(payload.expiresAt).toISOString()
      : null;

    if (!code) {
      return Response.json(
        { error: "Discount code is required" },
        { status: 400 },
      );
    }

    if (Number.isNaN(percentOff) || percentOff < 0 || percentOff > 100) {
      return Response.json(
        { error: "Percent off must be between 0 and 100" },
        { status: 400 },
      );
    }

    if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses <= 0)) {
      return Response.json(
        { error: "Max uses must be a positive integer" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("discount_codes")
      .insert({
        code,
        percent_off: percentOff,
        description,
        max_uses: maxUses,
        expires_at: expiresAt,
        active: true,
      })
      .select(
        "id, code, percent_off, description, active, max_uses, usage_count, expires_at, created_at",
      )
      .single();

    if (error) {
      console.error("Failed to create discount", error);
      return Response.json(
        { error: "Failed to create discount" },
        { status: 500 },
      );
    }

    return Response.json({ discount: data }, { status: 201 });
  } catch (error) {
    console.error("Discounts POST error", error);
    return Response.json({ error: "Server misconfiguration" }, { status: 500 });
  }
}
