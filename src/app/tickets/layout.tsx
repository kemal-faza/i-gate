import type { Metadata } from "next";
import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Beli Tiket",
  description: `${SITE_DESCRIPTION} Amankan kursi terbaikmu untuk malam penuh karya dan kehangatan keluarga besar Informatika.`,
  openGraph: {
    title: `Beli Tiket | ${SITE_NAME}`,
    description: `${SITE_DESCRIPTION} Amankan kursi terbaikmu untuk malam penuh karya dan kehangatan keluarga besar Informatika.`,
    images: [OG_IMAGE],
  },
  twitter: {
    title: `Beli Tiket | ${SITE_NAME}`,
    description: `${SITE_DESCRIPTION} Amankan kursi terbaikmu untuk malam penuh karya dan kehangatan keluarga besar Informatika.`,
    images: [OG_IMAGE],
  },
};

export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
