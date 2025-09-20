// @ts-ignore midtrans client type script definition is broken memang ERROR
import midtransClient from "midtrans-client";
import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

type TierKey = "regular" | "vip" | "vvip";

type TierConfig = {
  label: string;
  price: number;
};

const TIER_PRICING: Record<TierKey, TierConfig> = {
  regular: { label: "Regular", price: 100_000 },
  vip: { label: "VIP", price: 250_000 },
  vvip: { label: "VVIP", price: 500_000 },
};

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

function resolveAppUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL?.trim();
  if (vercel) {
    const prefix = vercel.startsWith("http") ? "" : "https://";
    return `${prefix}${vercel.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
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
    "error-codes"?: string[];
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

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();

    const orderUuid =
      typeof json?.orderUuid === "string" ? json.orderUuid.trim() : "";
    const tierKey =
      typeof json?.tierKey === "string" ? json.tierKey.toLowerCase() : "";
    const customer = json?.customer ?? {};
    const turnstileToken =
      typeof json?.turnstileToken === "string"
        ? json.turnstileToken.trim()
        : "";
    const discountCodeInput = json?.discountCode;

    const name = typeof customer?.name === "string" ? customer.name.trim() : "";
    const nim = typeof customer?.nim === "string" ? customer.nim.trim() : "";
    const email =
      typeof customer?.email === "string" ? customer.email.trim() : "";

    if (!orderUuid) {
      return Response.json(
        { error: "Missing Midtrans order id" },
        { status: 400 },
      );
    }

    const tier = TIER_PRICING[tierKey as TierKey];
    if (!tier) {
      return Response.json({ error: "Invalid ticket tier" }, { status: 400 });
    }

    if (!name || !nim || !email) {
      return Response.json(
        { error: "Customer information incomplete" },
        { status: 400 },
      );
    }

    if (!turnstileToken) {
      return Response.json(
        { error: "Human verification required" },
        { status: 400 },
      );
    }

    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (!turnstileSecret) {
      console.error("TURNSTILE_SECRET_KEY is not configured");
      return Response.json(
        { error: "Server misconfiguration" },
        { status: 500 },
      );
    }

    const remoteIp =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      null;

    try {
      await verifyTurnstile(turnstileToken, turnstileSecret, remoteIp);
    } catch (error) {
      console.warn("Turnstile rejected token", error);
      return Response.json(
        { error: "Human verification failed" },
        { status: 403 },
      );
    }

    const supabase = getSupabaseAdmin();

    const normalizedDiscount =
      discountCodeInput && typeof discountCodeInput === "string"
        ? discountCodeInput.trim().toUpperCase()
        : null;

    let discountPercent = 0;

    if (normalizedDiscount) {
      const { data: discount, error: discountError } = await supabase
        .from("discount_codes")
        .select("code, percent_off, active, max_uses, usage_count, expires_at")
        .eq("code", normalizedDiscount)
        .maybeSingle();

      if (discountError || !discount) {
        return Response.json(
          { error: "Invalid discount code" },
          { status: 400 },
        );
      }

      if (!discount.active) {
        return Response.json(
          { error: "Discount code is inactive" },
          { status: 400 },
        );
      }

      if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
        return Response.json(
          { error: "Discount code has expired" },
          { status: 400 },
        );
      }

      if (discount.max_uses !== null && typeof discount.max_uses === "number") {
        const { count, error: countError } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("discount_code", normalizedDiscount);

        if (
          !countError &&
          typeof count === "number" &&
          count >= discount.max_uses
        ) {
          return Response.json(
            { error: "Discount usage limit reached" },
            { status: 400 },
          );
        }
      }

      discountPercent = mapDiscountPercent(discount.percent_off);
    }

    const discountAmount = Math.round((tier.price * discountPercent) / 100);
    const grossAmount = Math.max(0, tier.price - discountAmount);

    const { data: existingOrder, error: fetchOrderError } = await supabase
      .from("orders")
      .select("id, total, status")
      .eq("id", orderUuid)
      .maybeSingle();

    if (fetchOrderError) {
      console.error("Failed to fetch existing order", fetchOrderError);
      return Response.json(
        { error: "Failed to validate order" },
        { status: 500 },
      );
    }

    if (existingOrder) {
      if (existingOrder.status !== "pending") {
        return Response.json(
          { error: "Order already processed" },
          { status: 409 },
        );
      }

      if (Number(existingOrder.total) !== grossAmount) {
        return Response.json({ error: "Amount mismatch" }, { status: 400 });
      }
    } else {
      const { error: insertError } = await supabase.from("orders").insert({
        id: orderUuid,
        tier_key: tierKey,
        tier_label: tier.label,
        total: grossAmount,
        status: "pending",
        name,
        nim,
        email,
        discount_code: normalizedDiscount,
        discount_percent: discountPercent,
      });

      if (insertError) {
        console.error("Failed to create order", insertError);
        return Response.json(
          { error: "Failed to create order" },
          { status: 500 },
        );
      }
    }

    let snap: ReturnType<typeof getSnapClient>;
    try {
      snap = getSnapClient();
    } catch (error) {
      console.error("Snap initialization error", error);
      return Response.json(
        { error: "Server misconfiguration" },
        { status: 500 },
      );
    }

    const baseUrl = resolveAppUrl();

    const transactionParams = {
      transaction_details: {
        order_id: orderUuid,
        gross_amount: grossAmount,
      },
      item_details: [
        {
          id: tierKey.toUpperCase(),
          name: `Tickets - ${tier.label}`,
          price: grossAmount,
          quantity: 1,
        },
      ],
      customer_details: {
        first_name: name || "Customer",
        email,
      },
      callbacks: {
        finish: `${baseUrl}/tickets/${orderUuid}/finish`,
        unfinish: `${baseUrl}/tickets/${orderUuid}/unfinish`,
        error: `${baseUrl}/tickets/${orderUuid}/error`,
      },
      credit_card: {
        secure: true,
      },
    } satisfies Record<string, unknown>;

    const transaction = await snap.createTransaction(transactionParams);

    return Response.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    });
  } catch (error) {
    console.error("Midtrans token API error", error);
    return Response.json(
      { error: "Failed to create transaction" },
      { status: 500 },
    );
  }
}
