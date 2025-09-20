import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import QRScannerPage from "./client-page";

const page = async () => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return <QRScannerPage />;
};

export default page;
