import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import AdminDashboard from "./_components/AdminDashboard";

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
