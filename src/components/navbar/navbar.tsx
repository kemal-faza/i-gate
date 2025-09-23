"use client";

import "./navbar.css";
import type { User } from "@supabase/supabase-js";
import { Cog, LockKeyholeIcon, LogOutIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Link } from "next-view-transitions";
import { useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { AnimatedThemeToggler } from "../ui/animated-theme-toggler";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { MainNav } from "./navbar.main";
import { MobileNav } from "./navbar.mobile";

type NavbarProps = {
  user: User | null;
};

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isHome = pathname === "/";

  const headerBase = "topNavHead z-10 sticky top-0 w-full border-b";
  const solid =
    "border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60";
  const transparent =
    "border-transparent bg-transparent backdrop-blur-0 supports-backdrop-filter:bg-transparent";

  async function handleSignOut() {
    try {
      setIsSigningOut(true);
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.refresh();
      router.push("/");
      location.reload(); 

    } catch (error) {
      console.error("Failed to sign out", error);
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <header className={`${headerBase} ${isHome ? transparent : solid} z-99`}>
      <div className="w-full px-8 mx-auto flex h-14 max-w-(--breakpoint-2xl) items-center">
        <MainNav />
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center gap-2">
            <AnimatedThemeToggler className="cursor-pointer pr-1.5" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Cog className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {user ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Admin Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                    >
                      <LogOutIcon className="mr-2 size-4" />
                      {isSigningOut ? "Signing out…" : "Sign out"}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/sign-in" className="flex items-center">
                      <LockKeyholeIcon className="mr-2 size-4" />
                      Sign in
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <MobileNav
              user={user}
              onSignOut={handleSignOut}
              isSigningOut={isSigningOut}
            />
          </nav>
        </div>
      </div>
    </header>
  );
}
