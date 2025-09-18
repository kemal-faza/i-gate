"use client";
import "./navbar.css";
import { MainNav } from "./navbar.main";
import { MobileNav } from "./navbar.mobile";
import { AnimatedThemeToggler } from "../ui/animated-theme-toggler";

export function Navbar() {
  return (
    <header className="topNavHead z-10 sticky top-0 w-full border-b border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
      <div className="w-full px-8 mx-auto flex h-14 max-w-(--breakpoint-2xl) items-center">
        <MainNav />
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center">
            <AnimatedThemeToggler className="cursor-pointer" />
            <MobileNav />
          </nav>
        </div>
      </div>
    </header>
  );
}
