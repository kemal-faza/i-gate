"use client";

import type { User } from "@supabase/supabase-js";
import { LockKeyholeIcon, Menu } from "lucide-react";
import Link, { type LinkProps } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { nav_links } from "./navbar.static";

type MobileNavProps = {
  user: User | null;
  onSignOut: () => Promise<void> | void;
  isSigningOut: boolean;
};

export function MobileNav({ user, onSignOut, isSigningOut }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile nav when route changes
  useEffect(() => {
    if (!pathname) return;
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="w-10 h-10 p-0 rounded-full sm:hidden hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="pr-0 w-full">
        <Separator className="my-4" />
        <nav className="flex flex-col gap-4 px-4">
          <MobileLink
            onOpenChange={setOpen}
            href="/"
            className="flex items-center m-4"
          >
            <Icons.logoNew className="mr-2 h-5 w-5" />
            <span className="font-bold text-lg">{"myudak"}</span>
          </MobileLink>
          {nav_links.map((link) => (
            <MobileLink
              key={link.name}
              onOpenChange={setOpen}
              href={link.href}
              className={cn(
                "flex items-center py-2 px-3 rounded-md transition-colors",
                pathname === link.href
                  ? "bg-accent text-accent-foreground font-medium"
                  : "hover:bg-accent/50 hover:text-accent-foreground",
              )}
            >
              <link.icon className="h-4 w-4 mr-2" aria-hidden="true" />
              <span>{link.name}</span>
            </MobileLink>
          ))}
          <Separator className="my-4" />
          {user ? (
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                void onSignOut();
              }}
              disabled={isSigningOut}
              className="mb-4"
            >
              {isSigningOut ? "Signing out…" : "Sign out"}
            </Button>
          ) : (
            <MobileLink
              onOpenChange={setOpen}
              href="/sign-in"
              className="flex items-center justify-center rounded-md border py-2 mb-4"
            >
              <LockKeyholeIcon className="mr-2 h-4 w-4" />
              Sign in
            </MobileLink>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

interface MobileLinkProps extends LinkProps {
  children: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

function MobileLink({
  href,
  onOpenChange,
  children,
  className,
  ...props
}: MobileLinkProps) {
  const router = useRouter();
  return (
    <Link
      href={href}
      onClick={() => {
        router.push(href.toString());
        onOpenChange?.(false);
      }}
      className={className}
      {...props}
    >
      {children}
    </Link>
  );
}
