"use client";

import React from "react";
import {
  PlusIcon,
  UserIcon,
  TicketIcon,
  ShoppingCartIcon,
  CalendarIcon,
  QrCodeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { customers, orders, tickets, events } from "../_data/mock";
import { formatCurrency } from "./format";
import {
  CustomersTable,
  OrdersTable,
  TicketsTable,
  EventsTable,
} from "./AdminTables";

type Tab = "customers" | "orders" | "tickets" | "events";

export default function AdminDashboard() {
  const [tab, setTab] = React.useState<Tab>("customers");

  const kpis = React.useMemo(() => {
    const revenue = orders
      .filter((o) => o.status === "paid")
      .reduce((sum, o) => sum + (o.currency === "IDR" ? o.amount : 0), 0);
    const paidUsd = orders
      .filter((o) => o.status === "paid")
      .reduce((sum, o) => sum + (o.currency === "USD" ? o.amount : 0), 0);

    return {
      customers: customers.length,
      orders: orders.length,
      tickets: tickets.length,
      revenueIdr: revenue,
      revenueUsd: paidUsd,
      events: events.length,
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 m-4">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Ticketing Admin
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage customers, orders, tickets, and events
          </p>
        </div>

        <div className="flex items-center gap-2">
          <NewItemDialog tab={tab} />
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          icon={<UserIcon className="size-4" />}
          label="Customers"
          value={kpis.customers.toString()}
        />
        <KpiCard
          icon={<ShoppingCartIcon className="size-4" />}
          label="Orders"
          value={kpis.orders.toString()}
        />
        <KpiCard
          icon={<TicketIcon className="size-4" />}
          label="Tickets"
          value={kpis.tickets.toString()}
        />
        <KpiCard
          icon={<CalendarIcon className="size-4" />}
          label="Events"
          value={kpis.events.toString()}
        />
        <KpiCard
          className="col-span-2"
          icon={<ShoppingCartIcon className="size-4" />}
          label="Revenue (IDR)"
          value={formatCurrency(kpis.revenueIdr, "IDR")}
        />
        <Link href="/admin/qr" className="col-span-2">
          <div className="rounded-lg border p-4 bg-background hover:bg-muted transition-colors">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <QrCodeIcon className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Scan</span>
                <span className="font-semibold">QR Ticket</span>
              </div>
              <Button size="sm">Open Scanner</Button>
            </div>
          </div>
        </Link>
      </section>

      <nav className="flex items-center gap-2 border-b pb-2">
        <TabButton
          active={tab === "customers"}
          onClick={() => setTab("customers")}
        >
          <UserIcon className="mr-2 size-4" />
          Customers
        </TabButton>
        <TabButton active={tab === "orders"} onClick={() => setTab("orders")}>
          <ShoppingCartIcon className="mr-2 size-4" />
          Orders
        </TabButton>
        <TabButton active={tab === "tickets"} onClick={() => setTab("tickets")}>
          <TicketIcon className="mr-2 size-4" />
          Tickets
        </TabButton>
        <TabButton active={tab === "events"} onClick={() => setTab("events")}>
          <CalendarIcon className="mr-2 size-4" />
          Events
        </TabButton>
      </nav>

      <main>
        {tab === "customers" && <CustomersTable />}
        {tab === "orders" && <OrdersTable />}
        {tab === "tickets" && <TicketsTable />}
        {tab === "events" && <EventsTable />}
      </main>
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center rounded-md px-3 py-1.5 text-sm",
        "border transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "hover:bg-muted border-transparent",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </button>
  );
}

function KpiCard({
  icon,
  label,
  value,
  className,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={["rounded-lg border p-4 bg-background", className]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground text-sm">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="mt-2 text-xl font-semibold">{value}</div>
    </div>
  );
}

function NewItemDialog({ tab }: { tab: Tab }) {
  const title =
    tab === "customers"
      ? "New Customer"
      : tab === "orders"
      ? "New Order"
      : tab === "tickets"
      ? "New Ticket"
      : "New Event";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="mr-2 size-4" />
          {title}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Design-only mock form. No data will be saved.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {/* Minimal generic mock form fields */}
          <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">Name / Title</span>
            <Input placeholder="Type here..." />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">Additional</span>
            <Input placeholder="..." />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button disabled>Save (mock)</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
