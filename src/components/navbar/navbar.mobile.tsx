"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Link, { LinkProps } from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { DialogTitle } from "../ui/dialog";
import { nav_links } from "./navbar.static";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile nav when route changes
  useEffect(() => {
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
        <DialogTitle>
          <MobileLink
            onOpenChange={setOpen}
            href="/"
            className="flex items-center m-4"
          >
            <Icons.logoNew className="mr-2 h-5 w-5" />
            <span className="font-bold text-lg">{"myudak"}</span>
          </MobileLink>
        </DialogTitle>
        <div className="flex items-center justify-between pr-4"></div>
        <Separator className="my-4" />
        <nav className="flex flex-col gap-4 px-4">
          {nav_links.map((link) => (
            <MobileLink
              key={link.name}
              onOpenChange={setOpen}
              href={link.href}
              className={cn(
                "flex items-center py-2 px-3 rounded-md transition-colors",
                pathname === link.href
                  ? "bg-accent text-accent-foreground font-medium"
                  : "hover:bg-accent/50 hover:text-accent-foreground"
              )}
            >
              <span className="mr-2 text-lg">{link.emoji}</span>
              <span>{link.name}</span>
            </MobileLink>
          ))}
        </nav>
        <Separator className="my-4" />
        <div className="flex flex-col gap-3 px-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Links
          </h3>
          <Link
            target="_blank"
            rel="noreferrer"
            href={"https://github.com"}
            className="flex items-center py-2 px-3 rounded-md hover:bg-accent/50 transition-colors"
          >
            <Icons.gitHub className="h-4 w-4 mr-2" /> GitHub
          </Link>
          <Link
            target="_blank"
            rel="noreferrer"
            href={"https://github.com"}
            className="flex items-center py-2 px-3 rounded-md hover:bg-accent/50 transition-colors"
          >
            <Icons.twitter className="h-4 w-4 mr-2" /> Twitter
          </Link>
        </div>
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
