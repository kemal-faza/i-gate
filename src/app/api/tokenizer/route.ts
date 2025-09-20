// @ts-expect-error
import Midtrans from "midtrans-client";
import { getSupabaseAdmin } from "@/lib/supabase";

const TIER_PRICING: Record<
  string,
  {
    label: string;
    price: number;
  }
> = {
  regular: { label: "Regular", price: 100_000 },
  vip: { label: "VIP", price: 250_000 },
  vvip: { label: "VVIP", price: 500_000 },
};

type SnapConfig = {
  isProduction: boolean;
  serverKey?: string;
  clientKey?: string;
};

type SnapInstance = {
  createTransactionToken: (
    parameter: Record<string, unknown>,
  ) => Promise<string>;
};

const Snap = (
  Midtrans as unknown as { Snap: new (config: SnapConfig) => SnapInstance }
).Snap;

export async function POST(req: Request) {
  try {
    const { orderId, tierKey, customer, turnstileToken, discountCode } =
      await req.json();

    if (!orderId) {
      return Response.json(
        { error: "Missing Midtrans order id" },
        { status: 400 },
      );
    }

    const tier = TIER_PRICING[String(tierKey ?? "").toLowerCase()];
    if (!tier) {
      return Response.json({ error: "Invalid ticket tier" }, { status: 400 });
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
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

    const turnstileBody = new URLSearchParams({
      secret: turnstileSecret,
      response: turnstileToken,
    });

    if (remoteIp) {
      turnstileBody.set("remoteip", remoteIp);
    }

    const verifyResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: turnstileBody,
      },
    );

    if (!verifyResponse.ok) {
      console.error(
        "Turnstile verification failed to respond",
        verifyResponse.status,
      );
      return Response.json({ error: "Verification failed" }, { status: 502 });
    }

    const verification = (await verifyResponse.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    if (!verification.success) {
      console.warn("Turnstile rejected token", verification["error-codes"]);
      return Response.json(
        { error: "Human verification failed" },
        { status: 403 },
      );
    }

    const normalizedDiscount = discountCode
      ? String(discountCode).trim().toUpperCase()
      : null;

    let discountPercent = 0;
    const supabase = normalizedDiscount ? getSupabaseAdmin() : null;

    if (normalizedDiscount && supabase) {
      const { data: discount, error: discountError } = await supabase
        .from("discount_codes")
        .select(
          "id, code, percent_off, active, max_uses, usage_count, expires_at",
        )
        .eq("code", normalizedDiscount)
        .maybeSingle();

      if (discountError || !discount) {
        console.warn(
          "Discount code not found",
          normalizedDiscount,
          discountError,
        );
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

        if (!countError && typeof count === "number") {
          if (count >= discount.max_uses) {
            return Response.json(
              { error: "Discount usage limit reached" },
              { status: 400 },
            );
          }
        }
      }

      discountPercent = Number(discount.percent_off ?? 0);
    }

    const discountAmount = Math.round((tier.price * discountPercent) / 100);
    const discountedPrice = Math.max(0, tier.price - discountAmount);

    const item_details = [
      {
        id: tierKey?.toString().toUpperCase() ?? tier.label,
        name: `Tickets - ${tier.label}`,
        price: discountedPrice,
        quantity: 1,
      },
    ];

    const gross_amount = discountedPrice;

    const snap = new Snap({
      isProduction: false,
      serverKey: process.env.SECRET,
      clientKey: process.env.NEXT_PUBLIC_CLIENT,
    });

    const parameter = {
      item_details,
      transaction_details: {
        order_id: orderId,
        gross_amount,
      },
      customer_details: customer
        ? {
            first_name: customer.name,
            email: customer.email,
          }
        : undefined,
      credit_card: {
        secure: true,
      },
    };

    const token = await snap.createTransactionToken(parameter);
    return Response.json({ token });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Failed to create transaction" },
      { status: 500 },
    );
  }
}
