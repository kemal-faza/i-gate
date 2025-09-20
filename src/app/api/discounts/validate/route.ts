import type { NextRequest } from "next/server";
import { DiscountValidationError, validateDiscountCode } from "@/lib/discounts";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    const supabase = getSupabaseAdmin();
    const discount = await validateDiscountCode(supabase, code);

    return Response.json({ discount });
  } catch (error) {
    if (error instanceof DiscountValidationError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    console.error("Discount validation route error", error);
    return Response.json(
      { error: "Failed to validate discount" },
      { status: 500 },
    );
  }
}
