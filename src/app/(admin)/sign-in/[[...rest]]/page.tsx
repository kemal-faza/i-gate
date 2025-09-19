"use client";
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-[60vh] grid place-items-center p-6">
      <SignIn routing="path" path="/sign-in" afterSignInUrl="/admin" />
    </div>
  );
}
