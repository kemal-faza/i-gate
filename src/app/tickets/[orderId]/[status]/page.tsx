import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Status Pembayaran",
  description: `${SITE_DESCRIPTION} Halaman status lama untuk referensi pembayaran I-GATE.`,
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: `Status Pembayaran | ${SITE_NAME}`,
    description: `${SITE_DESCRIPTION} Halaman status lama untuk referensi pembayaran I-GATE.`,
  },
};

const STATUS_CONFIG: Record<string, { title: string; subtitle: string }> = {
  finish: {
    title: "Thanks!",
    subtitle:
      "We've recorded your payment attempt. We'll update this order once Midtrans confirms the status.",
  },
  unfinish: {
    title: "Payment Incomplete",
    subtitle:
      "You closed the payment window before finishing. You can reopen checkout below to try again.",
  },
  error: {
    title: "Payment Failed",
    subtitle:
      "Something went wrong while processing the payment. You can try again or contact support if this keeps happening.",
  },
};

type Props = {
  params: {
    orderId: string;
    status: string;
  };
};

export default function TicketPaymentStatusPage({ params }: Props) {
  const { orderId, status } = params;
  const normalized = status.toLowerCase();
  const config = STATUS_CONFIG[normalized];

  if (!config) {
    notFound();
  }

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {config.title}
        </h1>
        <p className="text-muted-foreground text-base md:text-lg">
          {config.subtitle}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button asChild>
          <Link href={`/tickets?order=${orderId}`}>Back to tickets</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/tickets">Checkout again</Link>
        </Button>
      </div>
    </div>
  );
}
