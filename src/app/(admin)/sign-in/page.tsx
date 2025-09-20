"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export default function SignInPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "sign-in") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw signInError;
        }

        router.replace("/admin");
        router.refresh();
      } else {
        const { error: signUpError, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: fullName ? { full_name: fullName } : undefined,
            emailRedirectTo:
              process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL ??
              `${window.location.origin}/admin`,
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        if (data.user?.identities?.length === 0) {
          setMessage(
            "Check your inbox to confirm your email before signing in.",
          );
        } else {
          setMessage("Account created. You can sign in now.");
          setMode("sign-in");
        }
      }
    } catch (err) {
      console.error(err);
      const description =
        err instanceof Error ? err.message : "Unexpected error occurred.";
      setError(description);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] grid place-items-center px-6 py-12">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            {mode === "sign-in" ? "Sign in ADMIN" : "Create an account"}
          </h1>
          {/* <Button
            variant="link"
            onClick={() => {
              setMode((prev) => (prev === "sign-in" ? "sign-up" : "sign-in"));
              setMessage(null);
              setError(null);
            }}
          >
            {mode === "sign-in" ? "Need an account?" : "Have an account?"}
          </Button> */}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "sign-up" ? (
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Jane Doe"
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? (
            <p className="text-sm text-muted-foreground">{message}</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? "Please wait…"
              : mode === "sign-in"
                ? "Sign in"
                : "Sign up"}
          </Button>
        </form>
      </div>
    </div>
  );
}
