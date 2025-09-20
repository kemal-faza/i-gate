import { getSupabaseAdmin } from "@/lib/supabase";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const supabaseAuth = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;
    if (!id) {
      return Response.json({ error: "Missing discount id" }, { status: 400 });
    }

    const payload = await req.json();
    const updates: Record<string, unknown> = {};

    if (Object.hasOwn(payload, "active")) {
      updates.active = Boolean(payload.active);
    }

    if (Object.hasOwn(payload, "percentOff")) {
      const percentOff = Number(payload.percentOff);
      if (Number.isNaN(percentOff) || percentOff < 0 || percentOff > 100) {
        return Response.json(
          { error: "Percent off must be between 0 and 100" },
          { status: 400 },
        );
      }
      updates.percent_off = percentOff;
    }

    if (Object.hasOwn(payload, "description")) {
      updates.description = payload.description
        ? String(payload.description).trim()
        : null;
    }

    if (Object.hasOwn(payload, "maxUses")) {
      if (payload.maxUses === null) {
        updates.max_uses = null;
      } else {
        const maxUses = Number(payload.maxUses);
        if (!Number.isInteger(maxUses) || maxUses <= 0) {
          return Response.json(
            { error: "Max uses must be a positive integer" },
            { status: 400 },
          );
        }
        updates.max_uses = maxUses;
      }
    }

    if (Object.hasOwn(payload, "expiresAt")) {
      updates.expires_at = payload.expiresAt
        ? new Date(payload.expiresAt).toISOString()
        : null;
    }

    if (Object.keys(updates).length === 0) {
      return Response.json(
        { error: "No valid fields provided" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("discount_codes")
      .update(updates)
      .eq("id", id)
      .select(
        "id, code, percent_off, description, active, max_uses, usage_count, expires_at, created_at",
      )
      .single();

    if (error) {
      console.error("Failed to update discount", error);
      return Response.json(
        { error: "Failed to update discount" },
        { status: 500 },
      );
    }

    return Response.json({ discount: data });
  } catch (error) {
    console.error("Discount PATCH error", error);
    return Response.json({ error: "Server misconfiguration" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const supabaseAuth = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;
    if (!id) {
      return Response.json({ error: "Missing discount id" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("discount_codes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete discount", error);
      return Response.json(
        { error: "Failed to delete discount" },
        { status: 500 },
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Discount DELETE error", error);
    return Response.json({ error: "Server misconfiguration" }, { status: 500 });
  }
}
