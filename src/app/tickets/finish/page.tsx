import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import InteractiveBadge from "@/components/tickets/InteractiveBadge";
import QrDownloadButton from "@/components/tickets/QrDownloadButton";
import { Button } from "@/components/ui/button";
import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Status Pemesanan",
  description: `${SITE_DESCRIPTION} Lacak status pembayaran tiket dan akses QR resmi I-GATE 2025 di halaman ini.`,
  openGraph: {
    title: `Status Pemesanan | ${SITE_NAME}`,
    description: `${SITE_DESCRIPTION} Pantau pembayaran dan QR kode tiketmu secara real time.`,
    images: [OG_IMAGE],
  },
  twitter: {
    title: `Status Pemesanan | ${SITE_NAME}`,
    description: `${SITE_DESCRIPTION} Pantau pembayaran dan QR kode tiketmu secara real time.`,
    images: [OG_IMAGE],
  },
};

type OrderRecord = {
  id: string;
  status: string;
  name: string | null;
  email: string | null;
  nim: string | null;
  tier_label: string | null;
  total: number | null;
  gross_amount: number | null;
  payment_type: string | null;
  discount_code: string | null;
  discount_percent: number | null;
  created_at: string | null;
  paid_at: string | null;
  transaction_id: string | null;
};

type StatusConfig = {
  label: string;
  tone: string;
  background: string;
  description: string;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  paid: {
    label: "Paid",
    tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    background: "border-emerald-500/30 bg-emerald-500/5",
    description:
      "Pembayaran udah kelar! Tunjukin QR code ini pas masuk, terus simpen UUID-nya biar gampang kalo butuh bantuan.",
  },
  pending: {
    label: "Pending",
    tone: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    background: "border-amber-500/30 bg-amber-500/5",
    description:
      "We're still waiting for Midtrans to settle this transaction. This page refreshes with the final status once the payment clears.",
  },
  failed: {
    label: "Failed",
    tone: "border-red-500/30 bg-red-500/10 text-red-600",
    background: "border-red-500/30 bg-red-500/5",
    description:
      "Midtrans marked this payment as failed. You can return to checkout and try again with a different method.",
  },
  expired: {
    label: "Expired",
    tone: "border-slate-400/40 bg-slate-200/40 text-slate-600",
    background: "border-slate-400/30 bg-slate-200/30",
    description:
      "The payment window expired before Midtrans received funds. Start a new checkout to generate a fresh payment link.",
  },
};

const FALLBACK_STATUS = STATUS_CONFIG.pending;

type Props = {
  searchParams: {
    uuid?: string;
  };
};

const formatCurrency = (value: number | null | undefined) => {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDateTime = (input: string | null | undefined) => {
  if (!input) return "—";
  try {
    const date = new Date(input);
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return input;
  }
};

const formatPaymentType = (input: string | null | undefined) => {
  if (!input) return "—";
  return input
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const normalizeStatus = (status: string | null | undefined) =>
  String(status ?? "pending").toLowerCase();

function StatusBadge({ config }: { config: StatusConfig }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${config.tone}`}
    >
      {config.label}
    </span>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="text-muted-foreground text-base md:text-lg">
          {description}
        </p>
      </div>
      <Button asChild>
        <Link href="/tickets">Back to tickets</Link>
      </Button>
    </div>
  );
}

export default async function TicketFinishPage({ searchParams }: Props) {
  const uuid = searchParams?.uuid?.trim();

  if (!uuid) {
    return (
      <EmptyState
        title="Payment Attempt Recorded"
        description="Provide an order UUID to review the final status and QR code once the payment settles."
      />
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, status, name, email, nim, tier_label, total, gross_amount, payment_type, discount_code, discount_percent, created_at, paid_at, transaction_id",
    )
    .eq("id", uuid)
    .maybeSingle<OrderRecord>();

  if (error) {
    console.error("tickets/finish query error", error);
    return (
      <EmptyState
        title="Unable to load order"
        description="We hit a snag while fetching that order. Refresh the page or reopen it from the payment window."
      />
    );
  }

  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        description="We couldn't find an order with that UUID. Double-check the code or restart checkout."
      />
    );
  }

  const statusKey = normalizeStatus(order.status);
  const config = STATUS_CONFIG[statusKey] ?? FALLBACK_STATUS;
  const isPaid = statusKey === "paid";
  const totalDisplay = formatCurrency(order.gross_amount ?? order.total ?? 0);
  const discountPercent = Number(order.discount_percent ?? 0);
  const discountLabel = order.discount_code
    ? `${order.discount_code.toUpperCase()} (${discountPercent}% off)`
    : "None";
  const badgeInitial = order.name?.trim()?.charAt(0)?.toUpperCase() ?? "Y";
  const encodedOrderId = encodeURIComponent(order.id);
  const qrDisplayUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodedOrderId}`;
  const qrDownloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodedOrderId}`;
  const downloadFileName = `ticket-${order.id}.png`;

  return (
    <div className="mx-auto flex min-h-[60vh]  flex-col gap-10 px-6 py-12">
      <header className="space-y-3">
        <div className={`rounded-xl border p-5 shadow-sm ${config.background}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Order overview
              </h1>
              <p className="text-muted-foreground text-sm">
                {config.description}
              </p>
            </div>
            <StatusBadge config={config} />
          </div>
        </div>
        <div className="rounded-lg border-l-4 border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Jangan dishare link ini ke siapa pun ya. Soalnya di dalemnya udah ada
          semua yang lo butuhin buat ngeklaim tiket.
        </div>
      </header>

 <div className="flex w-full flex-col md:flex-row">

          <div className="w-2/5 hidden md:block p-8">
         <InteractiveBadge initial={badgeInitial} qrUrl={qrDownloadUrl} />
          </div>

          <div className="w-full md:w-3/5 p-4 md:p-8 flex flex-col gap-4">
            <div className="w-full">
      
          <article className="rounded-lg border bg-card p-4 md:p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Detail tiket</h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 text-sm">
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Order UUID</dt>
                <dd className="font-mono text-base">{order.id}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Tier</dt>
                <dd className="font-medium">{order.tier_label ?? "—"}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Customer</dt>
                <dd className="font-medium">{order.name ?? "—"}</dd>
                <dd className="text-xs text-muted-foreground">
                  {order.email ?? ""}
                </dd>
                <dd className="text-xs text-muted-foreground">
                  {order.nim ? `NIM ${order.nim}` : ""}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Total dibayar</dt>
                <dd className="font-medium">{totalDisplay}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Diskon</dt>
                <dd className="font-medium">{discountLabel}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Payment type</dt>
                <dd className="font-medium">
                  {formatPaymentType(order.payment_type)}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Transaction ID</dt>
                <dd className="font-medium">{order.transaction_id ?? "—"}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Created at</dt>
                <dd className="font-medium">
                  {formatDateTime(order.created_at)}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Paid at</dt>
                <dd className="font-medium">
                  {isPaid ? formatDateTime(order.paid_at) : "—"}
                </dd>
              </div>
            </dl>
          </article>

            </div>
      <div className="w-full">
         
    <aside className="rounded-lg border bg-card p-4 md:p-5 text-center shadow-sm">
          <h2 className="text-base font-semibold">Event QR</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {isPaid
              ? "Tunjukin QR ini pas di pintu masuk."
              : "QR unlocks after the payment settles."}
          </p>
          <div className="mt-5 flex items-center justify-center">
            {isPaid ? (
              <Image
                src={qrDisplayUrl}
                alt={`QR code untuk order ${order.id}`}
                width={200}
                height={200}
                className="rounded border bg-white p-2 shadow"
                priority
              />
            ) : (
              <div className="flex min-h-[220px] w-full items-center justify-center rounded-md border border-dashed bg-muted/40 p-6 text-sm text-muted-foreground">
                Waiting for settlement
              </div>
            )}
          </div>
          <div className="mt-4">
            <QrDownloadButton
              qrUrl={qrDownloadUrl}
              fileName={downloadFileName}
              disabled={!isPaid}
            />
          </div>
        </aside>
            </div>
          </div>
        </div>
{/* 
      <section className="grid gap-8 lg:grid-cols-[minmax(0,_1fr)_320px]">
        <div className="space-y-6">
          <article className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Detail tiket</h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 text-sm">
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Order UUID</dt>
                <dd className="font-mono text-base">{order.id}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Tier</dt>
                <dd className="font-medium">{order.tier_label ?? "—"}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Customer</dt>
                <dd className="font-medium">{order.name ?? "—"}</dd>
                <dd className="text-xs text-muted-foreground">
                  {order.email ?? ""}
                </dd>
                <dd className="text-xs text-muted-foreground">
                  {order.nim ? `NIM ${order.nim}` : ""}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Total dibayar</dt>
                <dd className="font-medium">{totalDisplay}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Diskon</dt>
                <dd className="font-medium">{discountLabel}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Payment type</dt>
                <dd className="font-medium">
                  {formatPaymentType(order.payment_type)}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Transaction ID</dt>
                <dd className="font-medium">{order.transaction_id ?? "—"}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Created at</dt>
                <dd className="font-medium">
                  {formatDateTime(order.created_at)}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Paid at</dt>
                <dd className="font-medium">
                  {isPaid ? formatDateTime(order.paid_at) : "—"}
                </dd>
              </div>
            </dl>
          </article>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="default">
              <Link href="/tickets">Balik ke halaman tiket</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/tickets?order=${encodedOrderId}`}>
                Mulai checkout baru
              </Link>
            </Button>
          </div>
        </div>

        <aside className="rounded-lg border bg-card p-5 text-center shadow-sm">
          <h2 className="text-base font-semibold">Event QR</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {isPaid
              ? "Tunjukin QR ini pas di pintu masuk."
              : "QR unlocks after the payment settles."}
          </p>
          <div className="mt-5 flex items-center justify-center">
            {isPaid ? (
              <Image
                src={qrDisplayUrl}
                alt={`QR code untuk order ${order.id}`}
                width={200}
                height={200}
                className="rounded border bg-white p-2 shadow"
                priority
              />
            ) : (
              <div className="flex min-h-[220px] w-full items-center justify-center rounded-md border border-dashed bg-muted/40 p-6 text-sm text-muted-foreground">
                Waiting for settlement
              </div>
            )}
          </div>
          <div className="mt-4">
            <QrDownloadButton
              qrUrl={qrDownloadUrl}
              fileName={downloadFileName}
              disabled={!isPaid}
            />
          </div>
        </aside>
      </section> */}

      <section className="rounded-lg border bg-card p-5 shadow-sm md:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Interactive event badge</h2>
            <p className="text-muted-foreground text-sm">
              Drag, flick, dan jelajahi badge digital kamu. QR-nya sama persis
              kayak yang tampil di halaman ini.
            </p>
          </div>
        </div>
        <div className="mt-5 h-[320px] w-full overflow-hidden rounded-lg border bg-black/70">
          <InteractiveBadge initial={badgeInitial} qrUrl={qrDownloadUrl} />
        </div>
        <p className="text-muted-foreground mt-3 text-xs">
          Tip: tap dan tahan di mobile buat pindahin badge 3D-nya sesuka kamu.
        </p>
      </section>
        <div className="flex flex-wrap gap-3">
            <Button asChild variant="default">
              <Link href="/tickets">Balik ke halaman tiket</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/tickets?order=${encodedOrderId}`}>
                Mulai checkout baru
              </Link>
            </Button>
          </div>
    </div>
  );
}
