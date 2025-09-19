// @ts-ignore
import Midtrans from "midtrans-client";

export async function POST(req: Request) {
  try {
    const { orderId, items, customer, turnstileToken } = await req.json();

    if (!turnstileToken) {
      return Response.json(
        { error: "Human verification required" },
        { status: 400 }
      );
    }

    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (!turnstileSecret) {
      console.error("TURNSTILE_SECRET_KEY is not configured");
      return Response.json(
        { error: "Server misconfiguration" },
        { status: 500 }
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
      }
    );

    if (!verifyResponse.ok) {
      console.error("Turnstile verification failed to respond", verifyResponse.status);
      return Response.json(
        { error: "Verification failed" },
        { status: 502 }
      );
    }

    const verification = (await verifyResponse.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    if (!verification.success) {
      console.warn("Turnstile rejected token", verification["error-codes"]);
      return Response.json(
        { error: "Human verification failed" },
        { status: 403 }
      );
    }

    const item_details = Array.isArray(items) ? items : [];
    const gross_amount = item_details.reduce(
      (sum: number, it: any) => sum + (it?.price || 0) * (it?.quantity || 0),
      0
    );

    const snap = new (Midtrans as any).Snap({
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
      { status: 500 }
    );
  }
}
