"use client";

import { Icons } from "@/components/ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

import React from "react";
import { nav_links } from "./navbar.static";
import TransitionLink from "../TransitionLink";

export function MainNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      <TransitionLink href="/" className="mr-6 flex items-center space-x-2">
        <Icons.logoNew className="h-6 w-6 logo-containerNew" />
        <span className="sr-only">My site Icon</span>
      </TransitionLink>
      <div className="hidden lg:flex items-center space-x-4">
        {nav_links.map((item) => {
          const Icon = item.icon;
          return (
            <TransitionLink
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive(item.href)
                  ? "text-neutral-800 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800/40 shadow-sm"
                  : "text-gray-700 dark:text-gray-300 hover:text-neutral-800 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800/40 hover:shadow-sm"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.name}</span>
            </TransitionLink>
          );
        })}
      </div>
    </nav>
  );
}
