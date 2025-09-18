"use client";
import "./navbar.css";
import { MainNav } from "./navbar.main";
import { MobileNav } from "./navbar.mobile";
import { AnimatedThemeToggler } from "../ui/animated-theme-toggler";
import { usePathname } from "next/navigation";
import { SignedOut, SignedIn, UserButton } from "@clerk/nextjs";

import { Cog, LockKeyholeIcon, TerminalIcon } from "lucide-react";
import { Link } from "next-view-transitions";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const headerBase = "topNavHead z-10 sticky top-0 w-full border-b";
  const solid =
    "border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60";
  const transparent =
    "border-transparent bg-transparent backdrop-blur-0 supports-backdrop-filter:bg-transparent";

  return (
    <header className={`${headerBase} ${isHome ? transparent : solid}`}>
      <div className="w-full px-8 mx-auto flex h-14 max-w-(--breakpoint-2xl) items-center">
        <MainNav />
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center">
            <AnimatedThemeToggler className="cursor-pointer pr-1.5" />
            <MobileNav />

            <SignedOut>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <Cog className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <LockKeyholeIcon className="size-4" />
                    <Link href="/sign-in">Sign in</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SignedOut>
            <SignedIn>
              <Link
                href="/admin"
                className="text-sm px-3 py-1 rounded-md border ml-2"
              >
                Admin
              </Link>
              <div className="ml-2">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </nav>
        </div>
      </div>
    </header>
  );
}
