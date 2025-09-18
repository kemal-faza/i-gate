"use client";

import { Icons } from "@/components/ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuContent,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import React from "react";
import { nav_links } from "./navbar.static";

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <Icons.logoNew className="h-6 w-6 logo-containerNew" />
        <span className="sr-only">My site Icon</span>
      </Link>
      {nav_links.map((link, i) => (
        <NavigationMenu key={i}>
          <NavigationMenuList>
            <NavigationMenuItem key={link.name}>
              {link.name === "Roadmap" ? (
                <>
                  <Link href="/roadmap">
                    <NavigationMenuTrigger
                      className={cn(
                        "text-sm font-medium transition-colors hidden sm:inline-flex",
                        pathname === link.href
                          ? "text-foreground"
                          : "text-foreground/60"
                      )}
                    >
                      Roadmaps
                    </NavigationMenuTrigger>
                  </Link>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                      <ListItem title={"Algo Roadmap"} href={"/roadmap/algo"}>
                        {"Algorithm Leetcode Roadmap"}
                      </ListItem>
                      <ListItem title={"WebDev Roadmap"} href={"/roadmap/web"}>
                        {"WebDev Roadmap"}
                      </ListItem>
                      <ListItem title={"AI Roadmap"} href={"/roadmap/web"}>
                        {"Data AI Roadmap"}
                      </ListItem>
                      <ListItem title={"All Roadmap"} href={"/roadmap"}>
                        {"All Roadmaps"}
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </>
              ) : (
                <Link
                  legacyBehavior
                  passHref
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === link.href
                      ? "text-foreground"
                      : "text-foreground/60"
                  )}
                >
                  <NavigationMenuLink
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary hidden sm:inline-block",
                      pathname === link.href
                        ? "text-foreground"
                        : "text-foreground/60"
                    )}
                  >
                    {link.name}
                  </NavigationMenuLink>
                </Link>
              )}
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      ))}
    </nav>
  );
}

const ListItem = ({
  className,
  title,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"a">) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
};
ListItem.displayName = "ListItem";
