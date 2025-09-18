import type { LucideIcon } from "lucide-react";
import { Info, Ticket } from "lucide-react";

export type NavLink = {
  name: string;
  href: string;
  icon: LucideIcon;
};

export const nav_links: NavLink[] = [
  { name: "About", href: "/about", icon: Info },
  { name: "Tickets", href: "/tickets", icon: Ticket },
];
