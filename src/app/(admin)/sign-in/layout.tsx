import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Masuk Admin",
  description: `Portal autentikasi untuk tim ${SITE_NAME}.`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminSignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
