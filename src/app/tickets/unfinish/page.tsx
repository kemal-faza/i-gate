import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Pembayaran Belum Selesai",
  description: `${SITE_DESCRIPTION} Anda meninggalkan proses pembayaran. Lanjutkan transaksi untuk memastikan tiket tetap aman.`,
  openGraph: {
    title: `Pembayaran Belum Selesai | ${SITE_NAME}`,
    description: `${SITE_DESCRIPTION} Anda meninggalkan proses pembayaran. Lanjutkan transaksi untuk memastikan tiket tetap aman.`,
  },
  twitter: {
    title: `Pembayaran Belum Selesai | ${SITE_NAME}`,
    description: `${SITE_DESCRIPTION} Anda meninggalkan proses pembayaran. Lanjutkan transaksi untuk memastikan tiket tetap aman.`,
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function TicketUnfinishFallbackPage() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Payment Not Completed
        </h1>
        <p className="text-muted-foreground text-base md:text-lg">
          It looks like you backed out from the payment page. You can reopen
          checkout to continue or start over below.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button asChild>
          <Link href="/tickets">Try checkout again</Link>
        </Button>
      </div>
    </div>
  );
}
