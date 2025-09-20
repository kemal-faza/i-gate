import type { SupabaseClient } from "@supabase/supabase-js";

export class DiscountValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "DiscountValidationError";
    this.status = status;
  }
}

export type DiscountRecord = {
  id: string;
  code: string;
  percent_off: number;
  description: string | null;
  active: boolean;
  max_uses: number | null;
  usage_count: number | null;
  expires_at: string | null;
};

export function normalizeDiscountCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export async function validateDiscountCode(
  supabase: SupabaseClient,
  rawCode: unknown,
): Promise<DiscountRecord> {
  if (typeof rawCode !== "string") {
    throw new DiscountValidationError("Discount code is required");
  }

  const normalized = normalizeDiscountCode(rawCode);
  if (!normalized) {
    throw new DiscountValidationError("Discount code is required");
  }

  const { data: discount, error } = await supabase
    .from("discount_codes")
    .select(
      "id, code, percent_off, description, active, max_uses, usage_count, expires_at",
    )
    .eq("code", normalized)
    .maybeSingle();

  if (error) {
    throw new DiscountValidationError("Failed to validate discount", 500);
  }

  if (!discount) {
    throw new DiscountValidationError("Invalid discount code");
  }

  if (!discount.active) {
    throw new DiscountValidationError("Discount code is inactive");
  }

  if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
    throw new DiscountValidationError("Discount code has expired");
  }

  if (discount.max_uses !== null) {
    const { count, error: countError } = await supabase
      .from("orders")
      .select("id", { head: true, count: "exact" })
      .eq("discount_code", normalized);

    if (countError) {
      throw new DiscountValidationError("Failed to validate discount", 500);
    }

    if (typeof count === "number" && count >= discount.max_uses) {
      throw new DiscountValidationError("Discount usage limit reached");
    }
  }

  return {
    ...discount,
    code: normalized,
  } satisfies DiscountRecord;
}
