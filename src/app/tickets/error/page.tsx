import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Pembayaran Gagal",
  description: `${SITE_DESCRIPTION} Transaksi Anda belum berhasil. Periksa kembali detail pembayaran atau hubungi panitia.`,
  openGraph: {
    title: `Pembayaran Gagal | ${SITE_NAME}`,
    description: `${SITE_DESCRIPTION} Transaksi Anda belum berhasil. Periksa kembali detail pembayaran atau hubungi panitia.`,
  },
  twitter: {
    title: `Pembayaran Gagal | ${SITE_NAME}`,
    description: `${SITE_DESCRIPTION} Transaksi Anda belum berhasil. Periksa kembali detail pembayaran atau hubungi panitia.`,
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function TicketErrorFallbackPage() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Payment Failed
        </h1>
        <p className="text-muted-foreground text-base md:text-lg">
          Something went wrong while processing your payment. Please try again
          or contact support if the issue persists.
        </p>
      </div>
      <Button asChild>
        <Link href="/tickets">Back to tickets</Link>
      </Button>
    </div>
  );
}
