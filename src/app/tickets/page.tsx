"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Crown, Gem, Ticket as TicketIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
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
import { TIER_PRICING, type TierKey } from "@/lib/tickets/pricing";
import { createMidtransTokenAction, validateDiscountAction } from "./actions";

type Tier = {
  key: TierKey;
  label: string;
  price: number;
  icon: LucideIcon;
  perks: string[];
};

type AppliedDiscount = {
  id: string;
  code: string;
  percent_off: number;
  description?: string | null;
};

const TIERS: Tier[] = [
  {
    key: "regular",
    label: TIER_PRICING.regular.label,
    price: TIER_PRICING.regular.price,
    icon: TicketIcon,
    perks: ["duduk di lantai", "gk tau"],
  },
  {
    key: "vip",
    label: TIER_PRICING.vip.label,
    price: TIER_PRICING.vip.price,
    icon: Crown,
    perks: ["Priority ", "Duduk nyaman", "Dpt Merch"],
  },
  {
    key: "vvip",
    label: TIER_PRICING.vvip.label,
    price: TIER_PRICING.vvip.price,
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
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<TierKey>("regular");
  const [name, setName] = useState("");
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [discountCodeInput, setDiscountCodeInput] = useState<string>("");
  const [appliedDiscount, setAppliedDiscount] =
    useState<AppliedDiscount | null>(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [turnstileWidgetKey, setTurnstileWidgetKey] = useState(0);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  useEffect(() => {
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    if (!clientKey) {
      console.warn("Midtrans client key is not configured");
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      "script[data-midtrans-script]",
    );
    if (existingScript) return;

    const isProd = process.env.NEXT_PUBLIC_MIDTRANS_IS_PROD === "true";
    const script = document.createElement("script");
    script.src = isProd
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", clientKey);
    script.setAttribute("data-midtrans-script", "true");
    script.async = true;
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  const tier = useMemo(() => {
    const fallback = TIERS[0];
    return TIERS.find((t) => t.key === selectedTier) ?? fallback;
  }, [selectedTier]);

  const normalizedInput = discountCodeInput.trim().toUpperCase();

  const discountPercent = appliedDiscount?.percent_off ?? 0;

  const isDiscountApplied = useMemo(() => {
    if (!appliedDiscount) return false;
    return appliedDiscount.code.toUpperCase() === normalizedInput;
  }, [appliedDiscount, normalizedInput]);

  const subtotal = tier.price;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const total = Math.max(0, subtotal - discountAmount);

  const isEmailValid = email.trim().length > 3 && email.includes("@");
  const isDiscountValid = normalizedInput.length === 0 || isDiscountApplied;

  useEffect(() => {
    if (normalizedInput.length === 0) {
      if (appliedDiscount) {
        setAppliedDiscount(null);
      }
      if (discountError) {
        setDiscountError(null);
      }
    }
  }, [appliedDiscount, discountError, normalizedInput]);
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
    setCurrentOrderId(null);
  }

  async function applyDiscount() {
    if (!normalizedInput) {
      setDiscountError("Enter a discount code first.");
      return;
    }

    setIsApplyingDiscount(true);
    setDiscountError(null);
    try {
      const { discount } = await validateDiscountAction(normalizedInput);
      const applied: AppliedDiscount = {
        id: discount.id,
        code: discount.code,
        percent_off: discount.percent_off,
        description: discount.description,
      };

      setAppliedDiscount(applied);
      setDiscountCodeInput(applied.code);
      setDiscountError(null);
    } catch (error) {
      setAppliedDiscount(null);
      setDiscountError(
        error instanceof Error ? error.message : "Failed to validate code",
      );
    } finally {
      setIsApplyingDiscount(false);
    }
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
      const discountCode = appliedDiscount?.code ?? null;

      const { token } = await createMidtransTokenAction({
        orderUuid,
        tierKey: tier.key,
        customer: { name, email, nim },
        turnstileToken: turnstileToken ?? "",
        discountCode,
      });

      setCurrentOrderId(orderUuid);
      setDiscountError(null);

      if (window.snap) {
        window.snap.pay(token, {
          onSuccess: () => {
            const destination = `/tickets/finish?uuid=${encodeURIComponent(orderUuid)}`;
            router.push(destination);
          },
          onPending: () => {
            console.log("pending");
            // setOpen(true);
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
      const lower = message.toLowerCase();

      if (lower.includes("human")) {
        turnstileMessage = message;
        setTurnstileError(message);
      } else if (lower.includes("discount")) {
        setAppliedDiscount(null);
        setDiscountError(message);
      } else {
        alert(message);
      }
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
                void applyDiscount();
              }}
              disabled={
                normalizedInput.length === 0 ||
                isApplyingDiscount ||
                isDiscountApplied
              }
            >
              {isApplyingDiscount ? "Applying…" : "Apply"}
            </Button>
          </div>
          {discountError ? (
            <p className="text-xs text-destructive">{discountError}</p>
          ) : isApplyingDiscount ? (
            <p className="text-xs text-muted-foreground">
              Validating discount code…
            </p>
          ) : isDiscountApplied ? (
            <p className="text-xs text-muted-foreground">
              Code applied: {appliedDiscount?.code.toUpperCase()} (
              {discountPercent}% off)
            </p>
          ) : normalizedInput ? (
            <p className="text-xs text-muted-foreground">
              Click Apply to validate this discount code.
            </p>
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
                  Selesaikan tantangan Turnstile untuk mengaktifkan checkout.
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
              <span className="text-muted-foreground">Order UUID</span>
              <span className="font-medium">{currentOrderId ?? "—"}</span>
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
