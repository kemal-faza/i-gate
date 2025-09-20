import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies, type UnsafeUnwrappedCookies } from "next/headers";

export function getSupabaseServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are not configured");
  }

  const cookieStore = (cookies() as unknown as UnsafeUnwrappedCookies);

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore
          .getAll()
          .map((cookie) => ({ name: cookie.name, value: cookie.value }));
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          cookieStore.set({
            name,
            value,
            ...(options as CookieOptions),
          });
        });
      },
    },
  });
}
