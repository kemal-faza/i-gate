import "./globals.css";
import type { User } from "@supabase/supabase-js";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { ViewTransitions } from "next-view-transitions";
import { Navbar } from "@/components/navbar/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import BackgroundGrid from "@/components/ui/background-grid";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "I-GATE | Informatika",
  description: "I-GATE (Informatics Gathering) 2025 - Shine, Unite, Celebrate!",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUser: User | null = user ?? null;

  return (
    <ViewTransitions>
      <html suppressHydrationWarning lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <BackgroundGrid />
            <Navbar user={currentUser} />
            <Script
              src="https://app.sandbox.midtrans.com/snap/snap.js"
              data-client-key={process.env.NEXT_PUBLIC_CLIENT}
              strategy="afterInteractive"
            />
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}
