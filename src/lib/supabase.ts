import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseAdmin() {
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        "X-Client-Info": "i-gate-1-admin",
      },
    },
  });
}
