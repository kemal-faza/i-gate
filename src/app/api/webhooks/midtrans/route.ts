import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

function mapStatus(transactionStatus: string, fraudStatus?: string) {
  switch (transactionStatus) {
    case "capture":
      return fraudStatus === "accept" ? "paid" : "pending";
    case "settlement":
      return "paid";
    case "pending":
      return "pending";
    case "deny":
    case "cancel":
      return "failed";
    case "expire":
      return "expired";
    default:
      return "pending";
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const orderId = payload?.order_id as string | undefined;
    const statusCode = payload?.status_code as string | undefined;
    const grossAmount = payload?.gross_amount as string | undefined;
    const signatureKey = payload?.signature_key as string | undefined;
    const transactionStatus = payload?.transaction_status as string | undefined;
    const fraudStatus = payload?.fraud_status as string | undefined;

    if (
      !orderId ||
      !statusCode ||
      !grossAmount ||
      !signatureKey ||
      !transactionStatus
    ) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      console.error("MIDTRANS_SERVER_KEY is not configured");
      return Response.json(
        { error: "Server misconfiguration" },
        { status: 500 },
      );
    }

    const computedSignature = crypto
      .createHash("sha512")
      .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
      .digest("hex");

    if (computedSignature !== String(signatureKey).toLowerCase()) {
      return Response.json({ error: "Invalid signature" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const nextStatus = mapStatus(transactionStatus, fraudStatus);

    const { data, error } = await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", orderId)
      .select("id, status")
      .maybeSingle();

    if (error) {
      console.error("Failed to update order", error);
      return Response.json({ ok: false }, { status: 500 });
    }

    if (!data) {
      console.warn("Webhook received for unknown order", orderId);
      return Response.json({ ok: true });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Midtrans webhook error", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export function GET() {
  return Response.json({ ok: true });
}
