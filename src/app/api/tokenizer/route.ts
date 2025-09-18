// @ts-ignore
import Midtrans from "midtrans-client";

export async function POST(req: Request) {
  try {
    const { orderId, items, customer } = await req.json();

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
