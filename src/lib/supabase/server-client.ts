import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Define MutableCookies type locally since it's not exported by next/headers
type MutableCookies = {
  set: (options: { name: string; value: string; options?: CookieOptions }) => void;
};

export async function getSupabaseServerClient(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are not configured");
  }

  const cookieStore = await cookies();
  const mutableCookies =
    typeof (cookieStore as MutableCookies | undefined)?.set === "function"
      ? (cookieStore as unknown as MutableCookies)
      : null;

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore
          .getAll()
          .map((cookie) => ({ name: cookie.name, value: cookie.value }));
      },
      setAll(cookies) {
        if (!mutableCookies) {
          return;
        }

        cookies.forEach(({ name, value, options }) => {
          try {
            mutableCookies.set({
              name,
              value,
              ...(options as CookieOptions),
            });
          } catch (error) {
            console.warn("Failed to set auth cookie", error);
          }
        });
      },
    },
  });
}
