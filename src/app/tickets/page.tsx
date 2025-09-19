"use client";

import React, { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Ticket as TicketIcon, Crown, Gem, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TierKey = "regular" | "vip" | "vvip";

type Tier = {
  key: TierKey;
  label: string;
  price: number;
  icon: LucideIcon;
  perks: string[];
};

const TIERS: Tier[] = [
  {
    key: "regular",
    label: "Regular",
    price: 100_000,
    icon: TicketIcon,
    perks: ["duduk di lantai", "gk tau"],
  },
  {
    key: "vip",
    label: "VIP",
    price: 250_000,
    icon: Crown,
    perks: ["Priority ", "Duduk nyaman", "Dpt Merch"],
  },
  {
    key: "vvip",
    label: "VVIP",
    price: 500_000,
    icon: Gem,
    perks: ["Bisa Tiduran", "Merch OP ++ ", "++++"],
  },
];

const TIER_STYLES: Record<
  TierKey,
  {
    ring: string;
    hover: string;
    border: string;
    icon: string;
    dot: string;
    gradient: string;
    shadow: string;
    priceBg: string;
    priceText: string;
    priceRing: string;
    blob: string;
  }
> = {
  regular: {
    ring: "ring-blue-500",
    hover:
      "hover:border-blue-400/60 hover:bg-blue-50/40 dark:hover:bg-blue-950/20",
    border: "border-blue-500/20",
    icon: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500/60",
    gradient: "from-blue-500 to-cyan-400",
    shadow: "shadow-blue-500/20",
    priceBg: "bg-blue-500/10",
    priceText: "text-blue-700 dark:text-blue-300",
    priceRing: "ring-blue-500/20",
    blob: "bg-blue-500",
  },
  vip: {
    ring: "ring-amber-500",
    hover:
      "hover:border-amber-400/60 hover:bg-amber-50/40 dark:hover:bg-amber-950/20",
    border: "border-amber-500/20",
    icon: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500/60",
    gradient: "from-amber-500 to-yellow-400",
    shadow: "shadow-amber-500/20",
    priceBg: "bg-amber-500/10",
    priceText: "text-amber-700 dark:text-amber-300",
    priceRing: "ring-amber-500/20",
    blob: "bg-amber-500",
  },
  vvip: {
    ring: "ring-fuchsia-500",
    hover:
      "hover:border-fuchsia-400/60 hover:bg-fuchsia-50/40 dark:hover:bg-fuchsia-950/20",
    border: "border-fuchsia-500/20",
    icon: "text-fuchsia-600 dark:text-fuchsia-400",
    dot: "bg-fuchsia-500/60",
    gradient: "from-fuchsia-500 to-rose-500",
    shadow: "shadow-fuchsia-500/20",
    priceBg: "bg-fuchsia-500/10",
    priceText: "text-fuchsia-700 dark:text-fuchsia-300",
    priceRing: "ring-fuchsia-500/20",
    blob: "bg-fuchsia-500",
  },
};

const CODES: Record<string, number> = {
  MURAH: 10,
};

const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export default function TicketsPage() {
  const [selectedTier, setSelectedTier] = useState<TierKey>("regular");
  const [name, setName] = useState("");
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [discountCodeInput, setDiscountCodeInput] = useState<string>("");
  const [appliedDiscountCode, setAppliedDiscountCode] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const tier = useMemo(
    () => TIERS.find((t) => t.key === selectedTier)!,
    [selectedTier]
  );

  const discountPercent = useMemo(() => {
    const code = appliedDiscountCode.trim().toUpperCase();
    return CODES[code] ?? 0;
  }, [appliedDiscountCode]);

  const inputPreviewPercent = useMemo(() => {
    const code = discountCodeInput.trim().toUpperCase();
    return CODES[code] ?? 0;
  }, [discountCodeInput]);

  const subtotal = tier.price;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const total = Math.max(0, subtotal - discountAmount);

  const isEmailValid = email.trim().length > 3 && email.includes("@");
  const isDiscountValid =
    appliedDiscountCode.trim().length === 0 || discountPercent > 0;
  const isFormValid =
    name.trim().length > 0 &&
    nim.trim().length > 0 &&
    isEmailValid &&
    isDiscountValid;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isFormValid) return;
    void checkout();
  }

  function resetForm() {
    setSelectedTier("regular");
    setName("");
    setNim("");
    setEmail("");
    setDiscountCodeInput("");
    setAppliedDiscountCode("");
  }

  const normalizedInput = discountCodeInput.trim().toUpperCase();

  async function checkout() {
    try {
      setIsLoading(true);
      const items = [
        {
          id: tier.key.toUpperCase(),
          name: `Tickets - ${tier.label}`,
          price: total,
          quantity: 1,
        },
      ];
      const data = {
        orderId: `EVT-${Date.now()}`,
        items,
        customer: { name, email },
      };

      const res = await fetch("/api/tokenizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create transaction");
      const { token } = await res.json();

      if (window.snap) {
        window.snap.pay(token, {
          onSuccess: () => {
            console.log("success");
            setOpen(true);
          },
          onPending: () => {
            console.log("pending");
            setOpen(true);
          },
          onError: () => alert("Payment failed. Try again."),
          onClose: () => {},
        });
      } else {
        alert("Payment SDK not loaded.");
      }
    } catch (e) {
      console.error(e);
      alert("Error starting payment");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Ticketing I - GATE ヾ(≧ ▽ ≦)ゝ
        </h1>
        <p className="text-muted-foreground mt-2">
          Pilih jenis tiket, isi data diri terus lanjutin ke pembayaran
        </p>
      </header>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Select Tier
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {TIERS.map((t) => {
            const Icon = t.icon;
            const selected = t.key === selectedTier;
            const styles = TIER_STYLES[t.key];

            return (
              <Card
                key={t.key}
                role="button"
                tabIndex={0}
                aria-pressed={selected}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedTier(t.key);
                  }
                }}
                onClick={() => setSelectedTier(t.key)}
                className={[
                  "group relative cursor-pointer overflow-hidden rounded-lg border bg-card transition-all duration-200 shadow-sm hover:shadow-lg",
                  "hover:-translate-y-0.5",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  styles.border,
                  styles.hover,
                  selected
                    ? [
                        "ring-2",
                        styles.ring,
                        styles.shadow,
                        "bg-muted/40",
                        "border-transparent",
                      ].join(" ")
                    : "",
                ].join(" ")}
              >
                <div
                  className={[
                    "pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
                    styles.gradient,
                  ].join(" ")}
                />
                <div
                  className={[
                    "pointer-events-none absolute -right-8 -bottom-10 hidden h-24 w-24 rounded-full blur-2xl opacity-25 md:block",
                    styles.blob,
                  ].join(" ")}
                />
                {t.key === "vip" && !selected ? (
                  <span className="absolute right-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-amber-600 ring-1 ring-amber-500/30 backdrop-blur">
                    Popular
                  </span>
                ) : null}
                {selected ? (
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium ring-1 ring-foreground/10 backdrop-blur">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Selected
                  </span>
                ) : null}

                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon
                          className={[
                            "h-5 w-5 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3",
                            styles.icon,
                          ].join(" ")}
                        />
                        <span className="font-semibold">{t.label}</span>
                      </div>
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
                          styles.priceBg,
                          styles.priceText,
                          styles.priceRing,
                        ].join(" ")}
                      >
                        {formatIDR(t.price)}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {t.perks.map((p, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span
                          className={[
                            "h-1.5 w-1.5 rounded-full",
                            styles.dot,
                          ].join(" ")}
                        />
                        {p}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Separator className="my-6" />

      <form onSubmit={onSubmit} className="space-y-5">
        <h2 className="text-sm font-medium text-muted-foreground">
          Your Details
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium" htmlFor="name">
              Nama
            </Label>
            <Input
              id="name"
              placeholder="Nama lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium" htmlFor="nim">
              NIM
            </Label>
            <Input
              id="nim"
              placeholder="Nomor Induk Mahasiswa (NIM)"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-sm font-medium" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {!isEmailValid && email.length > 0 ? (
              <p className="text-xs text-destructive mt-1">
                Enter a valid email.
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2 max-w-md">
          <Label className="text-sm font-medium" htmlFor="discountCode">
            Discount Code
          </Label>
          <div className="flex gap-2">
            <Input
              id="discountCode"
              type="text"
              placeholder="kode diskon"
              value={discountCodeInput}
              onChange={(e) => setDiscountCodeInput(e.target.value)}
            />
            <Button
              type="button"
              onClick={() => setAppliedDiscountCode(normalizedInput)}
              disabled={
                normalizedInput.length === 0 ||
                appliedDiscountCode.trim().toUpperCase() === normalizedInput
              }
            >
              Apply
            </Button>
          </div>
          {appliedDiscountCode ? (
            discountPercent > 0 ? (
              <p className="text-xs text-muted-foreground">
                Code applied: {appliedDiscountCode.toUpperCase()} (
                {discountPercent}% off)
              </p>
            ) : (
              <p className="text-xs text-destructive">Invalid code.</p>
            )
          ) : discountCodeInput ? (
            inputPreviewPercent > 0 ? (
              <p className="text-xs text-muted-foreground">
                This code gives {inputPreviewPercent}% off. Click Apply.
              </p>
            ) : (
              <p className="text-xs text-destructive">Invalid code.</p>
            )
          ) : (
            <p className="text-xs text-muted-foreground">
              Leave empty if you don't have a code.
            </p>
          )}
        </div>

        <div className="rounded-lg border bg-muted/30 p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Summary
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Tier</span>
              <span className="font-medium">{tier.label}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-medium">{formatIDR(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>
                Discount{" "}
                {discountPercent > 0 ? `(${discountPercent}%)` : "(None)"}
              </span>
              <span className="font-medium text-muted-foreground">
                - {formatIDR(discountAmount)}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-base">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">{formatIDR(total)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            className="min-w-28"
          >
            Reset
          </Button>
          <Button
            type="submit"
            className="min-w-32"
            disabled={!isFormValid || total <= 0 || isLoading}
          >
            {isLoading ? "Processing…" : "Checkout"}
          </Button>
        </div>
      </form>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Checkout Successful
            </DialogTitle>
            <DialogDescription>
              Your ticket has been reserved. Review the details below.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">NIM</span>
              <span className="font-medium">{nim}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{email}</span>
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tier</span>
              <span className="font-medium">{tier.label}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatIDR(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-medium">
                {discountPercent > 0
                  ? `${discountPercent}% (-${formatIDR(discountAmount)})`
                  : `None (-${formatIDR(0)})`}
              </span>
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between text-base">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">{formatIDR(total)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setOpen(false);
                // Keep details after checkout; comment next line to preserve
                // resetForm();
              }}
              className="min-w-28"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
