import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} Admin`,
    template: `%s | ${SITE_NAME} Admin`,
  },
  description:
    "Area internal panitia I-GATE untuk memantau penjualan tiket, pemindaian QR, dan pengelolaan promo.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
