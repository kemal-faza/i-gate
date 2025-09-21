import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import AdminDashboard from "./_components/AdminDashboard";

export const metadata: Metadata = {
  title: "Dasbor",
  description:
    "Ringkasan penjualan, kehadiran, dan promosi untuk panitia I-GATE 2025.",
};

export default async function Page() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return <AdminDashboard />;
}
