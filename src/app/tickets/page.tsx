"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Crown, Gem, Ticket as TicketIcon } from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type TierKey = "regular" | "vip" | "vvip";

type Tier = {
  key: TierKey;
  label: string;
  price: number;
  icon: LucideIcon;
  perks: string[];
};

type DiscountRow = {
  id: string;
  code: string;
  percent_off: number;
  description?: string | null;
  active: boolean;
  max_uses?: number | null;
  usage_count?: number | null;
  expires_at?: string | null;
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
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountRow | null>(
    null,
  );
  const [discountCodes, setDiscountCodes] = useState<DiscountRow[]>([]);
  const [discountsLoading, setDiscountsLoading] = useState(false);
  const [discountsError, setDiscountsError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [turnstileWidgetKey, setTurnstileWidgetKey] = useState(0);
  const [currentOrder, setCurrentOrder] = useState<{
    orderId: string;
    orderUuid: string;
  } | null>(null);

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  const loadDiscounts = useCallback(async () => {
    setDiscountsLoading(true);
    try {
      const res = await fetch("/api/discounts", { cache: "no-store" });
      if (!res.ok) {
        const errorPayload = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(errorPayload?.error ?? "Failed to load discount codes");
      }

      const payload = (await res.json()) as {
        discounts?: DiscountRow[];
      };

      setDiscountCodes(payload.discounts ?? []);
      setDiscountsError(null);
    } catch (error) {
      console.error(error);
      setDiscountsError(
        error instanceof Error
          ? error.message
          : "Failed to load discount codes",
      );
    } finally {
      setDiscountsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await loadDiscounts();
      } catch (error) {
        if (active) {
          console.error("loadDiscounts error", error);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [loadDiscounts]);

  const findValidDiscount = useCallback(
    (code: string | null | undefined) => {
      if (!code) return null;
      const normalized = code.trim().toUpperCase();
      if (!normalized) return null;

      const entry = discountCodes.find(
        (discount) => discount.code.toUpperCase() === normalized,
      );

      if (!entry) return null;
      if (!entry.active) return null;

      if (entry.expires_at) {
        const expiresAt = new Date(entry.expires_at).getTime();
        if (!Number.isNaN(expiresAt) && expiresAt < Date.now()) {
          return null;
        }
      }

      if (
        typeof entry.max_uses === "number" &&
        typeof entry.usage_count === "number" &&
        entry.max_uses >= 0 &&
        entry.usage_count >= entry.max_uses
      ) {
        return null;
      }

      return entry;
    },
    [discountCodes],
  );

  useEffect(() => {
    if (!appliedDiscount) return;
    const refreshed = findValidDiscount(appliedDiscount.code);
    if (!refreshed) {
      setAppliedDiscount(null);
      return;
    }

    if (
      refreshed.id !== appliedDiscount.id ||
      refreshed.percent_off !== appliedDiscount.percent_off ||
      refreshed.active !== appliedDiscount.active ||
      refreshed.max_uses !== appliedDiscount.max_uses ||
      refreshed.usage_count !== appliedDiscount.usage_count ||
      refreshed.expires_at !== appliedDiscount.expires_at
    ) {
      setAppliedDiscount(refreshed);
    }
  }, [appliedDiscount, findValidDiscount]);

  const tier = useMemo(() => {
    const fallback = TIERS[0];
    return TIERS.find((t) => t.key === selectedTier) ?? fallback;
  }, [selectedTier]);

  const normalizedInput = discountCodeInput.trim().toUpperCase();

  const discountPercent = appliedDiscount?.percent_off ?? 0;

  const inputPreviewPercent = useMemo(() => {
    if (!normalizedInput) return 0;
    const result = findValidDiscount(normalizedInput);
    return result?.percent_off ?? 0;
  }, [findValidDiscount, normalizedInput]);

  const subtotal = tier.price;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const total = Math.max(0, subtotal - discountAmount);

  const isEmailValid = email.trim().length > 3 && email.includes("@");
  const isDiscountValid = useMemo(() => {
    if (!appliedDiscount) return true;
    return Boolean(findValidDiscount(appliedDiscount.code));
  }, [appliedDiscount, findValidDiscount]);
  const isFormValid =
    name.trim().length > 0 &&
    nim.trim().length > 0 &&
    isEmailValid &&
    isDiscountValid;

  const isHuman = Boolean(turnstileToken);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
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
    setAppliedDiscount(null);
    setTurnstileToken(null);
    setTurnstileError(null);
    setTurnstileWidgetKey((key) => key + 1);
    setCurrentOrder(null);
  }

  async function checkout() {
    if (!isHuman) {
      setTurnstileError("Verify you are human before checking out.");
      return;
    }

    let turnstileMessage: string | null = null;

    try {
      setIsLoading(true);
      const orderUuid = crypto.randomUUID();
      const orderId = `EVT-${Date.now()}`;
      const discountCode = appliedDiscount?.code ?? null;

      const tokenizerPayload = {
        orderId,
        tierKey: tier.key,
        customer: { name, email },
        turnstileToken,
        discountCode,
      };

      const orderRecord = {
        id: orderUuid,
        orderId,
        tierKey: tier.key,
        tierLabel: tier.label,
        total,
        status: "pending" as const,
        name,
        nim,
        email,
        discountCode,
        discountPercent,
      };

      const res = await fetch("/api/tokenizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tokenizerPayload),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;

        if (res.status === 400 || res.status === 403) {
          const errorMessage = payload?.error ?? "Request rejected";

          if (errorMessage.toLowerCase().includes("human")) {
            turnstileMessage =
              payload?.error ?? "Human verification failed. Please retry.";
            setTurnstileError(turnstileMessage);
          } else if (errorMessage.toLowerCase().includes("discount")) {
            setAppliedDiscount(null);
            setDiscountsError(errorMessage);
          }
        }

        throw new Error(payload?.error ?? "Failed to create transaction");
      }

      const { token } = await res.json();

      setCurrentOrder({ orderId, orderUuid });
      setDiscountsError(null);

      let pendingSaved = false;
      const persistPending = async () => {
        if (pendingSaved) return;
        pendingSaved = true;
        try {
          const response = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderRecord),
          });

          if (!response.ok) {
            const payload = await response.json().catch(() => null);
            throw new Error(payload?.error ?? "Failed to store order");
          }

          await loadDiscounts();
        } catch (error) {
          pendingSaved = false;
          console.error("Failed to persist pending order", error);
        }
      };

      if (window.snap) {
        window.snap.pay(token, {
          onSuccess: () => {
            console.log("success");
            setOpen(true);
          },
          onPending: () => {
            console.log("pending");
            void persistPending();
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
      const message = e instanceof Error ? e.message : "Error starting payment";
      alert(message);
    } finally {
      setIsLoading(false);
      setTurnstileToken(null);
      setTurnstileWidgetKey((key) => key + 1);
      if (!turnstileMessage) {
        setTurnstileError(null);
      }
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

            const buttonClass = [
              "group relative w-full cursor-pointer overflow-hidden rounded-lg border bg-card transition-all duration-200 shadow-sm hover:shadow-lg",
              "hover:-translate-y-0.5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              styles.border,
              styles.hover,
            ];

            if (selected) {
              buttonClass.push(
                "ring-2",
                styles.ring,
                styles.shadow,
                "bg-muted/40",
                "border-transparent",
              );
            }

            return (
              <button
                key={t.key}
                type="button"
                className={buttonClass.join(" ")}
                aria-pressed={selected}
                onClick={() => setSelectedTier(t.key)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedTier(t.key);
                  }
                }}
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

                <div className="px-6 pb-2 pt-6">
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
                </div>
                <div className="px-6 pb-6">
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {t.perks.map((p, index) => (
                      <li
                        key={`${t.key}-${p}-${index}`}
                        className="flex items-center gap-2"
                      >
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
                </div>
              </button>
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
              onClick={() => {
                const result = findValidDiscount(normalizedInput);
                if (result) {
                  setAppliedDiscount(result);
                  setDiscountCodeInput(result.code);
                } else {
                  setAppliedDiscount(null);
                }
              }}
              disabled={
                normalizedInput.length === 0 ||
                !!(
                  appliedDiscount &&
                  appliedDiscount.code.toUpperCase() === normalizedInput
                ) ||
                discountsLoading
              }
            >
              Apply
            </Button>
          </div>
          {discountsError ? (
            <p className="text-xs text-destructive">{discountsError}</p>
          ) : discountsLoading ? (
            <p className="text-xs text-muted-foreground">
              Loading discount codes…
            </p>
          ) : appliedDiscount ? (
            <p className="text-xs text-muted-foreground">
              Code applied: {appliedDiscount.code.toUpperCase()} (
              {discountPercent}% off)
            </p>
          ) : normalizedInput ? (
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
            disabled={!isFormValid || total <= 0 || isLoading || !isHuman}
          >
            {isLoading ? "Processing…" : "Checkout"}
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Human Verification</Label>
          {turnstileSiteKey ? (
            <div className="flex flex-col gap-2">
              <Turnstile
                key={turnstileWidgetKey}
                siteKey={turnstileSiteKey}
                onSuccess={(token) => {
                  setTurnstileToken(token);
                  setTurnstileError(null);
                }}
                onError={() => {
                  setTurnstileToken(null);
                  setTurnstileError(
                    "Verification failed. Try reloading the widget.",
                  );
                }}
                onExpire={() => {
                  setTurnstileToken(null);
                  setTurnstileError("Verification expired. Please try again.");
                }}
              />
              {turnstileError ? (
                <p className="text-xs text-destructive">{turnstileError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Complete the Turnstile challenge to enable checkout.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-destructive">
              Turnstile site key is missing. Ask an admin to configure
              `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
            </p>
          )}
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
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-medium">
                {currentOrder?.orderId ?? "—"}
              </span>
            </div>
            <Separator className="my-3" />
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
                  ? `${appliedDiscount?.code?.toUpperCase() ?? "Applied"} (${discountPercent}% / -${formatIDR(discountAmount)})`
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
