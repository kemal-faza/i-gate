"use server";

// @ts-expect-error midtrans type definitions incomplete
import midtransClient from "midtrans-client";
import { headers } from "next/headers";
import { validateDiscountCode } from "@/lib/discounts";
import { getSupabaseAdmin } from "@/lib/supabase";
import { TIER_PRICING, type TierKey } from "@/lib/tickets/pricing";

function getSnapClient() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  const isProduction = process.env.MIDTRANS_IS_PROD === "true";

  if (!serverKey || !clientKey) {
    throw new Error("Midtrans environment variables are not configured");
  }

  return new midtransClient.Snap({
    isProduction,
    serverKey,
    clientKey,
  });
}

async function verifyTurnstile(
  token: string,
  secret: string,
  remoteIp: string | null,
) {
  const body = new URLSearchParams({
    secret,
    response: token,
  });

  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  if (!response.ok) {
    throw new Error("Turnstile verification failed to respond");
  }

  const result = (await response.json()) as {
    success: boolean;
  };

  if (!result.success) {
    throw new Error("Human verification failed");
  }
}

function mapDiscountPercent(input: unknown): number {
  const parsed = Number(input);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.min(100, Math.floor(parsed));
}

export async function validateDiscountAction(code: string) {
  const supabase = getSupabaseAdmin();
  const discount = await validateDiscountCode(supabase, code);
  return { discount };
}

export type CreateSnapTokenInput = {
  orderUuid: string;
  tierKey: TierKey;
  customer: {
    name: string;
    email: string;
    nim: string;
  };
  turnstileToken: string;
  discountCode: string | null;
};

export async function createMidtransTokenAction(input: CreateSnapTokenInput) {
  const snap = getSnapClient();
  const supabase = getSupabaseAdmin();

  const tier = TIER_PRICING[input.tierKey];
  if (!tier) {
    throw new Error("Invalid ticket tier");
  }

  if (!input.customer.name || !input.customer.nim || !input.customer.email) {
    throw new Error("Customer information incomplete");
  }

  if (!input.turnstileToken) {
    throw new Error("Human verification required");
  }

  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (!turnstileSecret) {
    throw new Error("Server misconfiguration");
  }

  const requestHeaders = await headers();
  const remoteIp =
    requestHeaders.get("cf-connecting-ip") ??
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;

  await verifyTurnstile(input.turnstileToken, turnstileSecret, remoteIp);

  let normalizedDiscount: string | null = null;
  let discountPercent = 0;

  if (input.discountCode) {
    const validated = await validateDiscountCode(supabase, input.discountCode);
    normalizedDiscount = validated.code;
    discountPercent = mapDiscountPercent(validated.percent_off);
  }

  const discountAmount = Math.round((tier.price * discountPercent) / 100);
  const grossAmount = Math.max(0, tier.price - discountAmount);

  const { data: existingOrder, error: fetchOrderError } = await supabase
    .from("orders")
    .select("id, total, status")
    .eq("id", input.orderUuid)
    .maybeSingle();

  if (fetchOrderError) {
    throw new Error("Failed to validate order");
  }

  if (existingOrder) {
    if (existingOrder.status !== "pending") {
      throw new Error("Order already processed");
    }

    if (Number(existingOrder.total) !== grossAmount) {
      throw new Error("Amount mismatch");
    }
  } else {
    const { error: insertError } = await supabase.from("orders").insert({
      id: input.orderUuid,
      order_id: input.orderUuid,
      tier_key: input.tierKey,
      tier_label: tier.label,
      total: grossAmount,
      gross_amount: grossAmount,
      status: "pending",
      name: input.customer.name,
      nim: input.customer.nim,
      email: input.customer.email,
      discount_code: normalizedDiscount,
      discount_percent: discountPercent,
    });

    if (insertError) {
      throw new Error("Failed to create order");
    }
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL.replace(/\/$/, "")}`
      : "http://localhost:3000");

  const orderParam = encodeURIComponent(input.orderUuid);

  const transaction = await snap.createTransaction({
    transaction_details: {
      order_id: input.orderUuid,
      gross_amount: grossAmount,
    },
    item_details: [
      {
        id: input.tierKey.toUpperCase(),
        name: `Tickets - ${tier.label}`,
        price: grossAmount,
        quantity: 1,
      },
    ],
    customer_details: {
      first_name: input.customer.name || "Customer",
      email: input.customer.email,
    },
    // callbacks: {
    //   finish: `${baseUrl}/tickets/finish?uuid=${orderParam}`,
    //   unfinish: `${baseUrl}/tickets/unfinish?uuid=${orderParam}`,
    //   error: `${baseUrl}/tickets/error?uuid=${orderParam}`,
    // },
    // credit_card: {
    //   secure: true,
    // },
  });

  return {
    token: transaction.token as string,
    // redirect_url: transaction.redirect_url as string,
  };
}
