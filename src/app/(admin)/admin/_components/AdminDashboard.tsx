"use client";

import {
  BadgePercent,
  Loader2,
  PowerIcon,
  QrCodeIcon,
  RefreshCw,
  ShoppingCartIcon,
  TicketIcon,
  Trash2,
  WalletIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchAttendancesAction,
  fetchDiscountsAction,
  fetchOrdersAction,
} from "../actions";
import { formatCurrency, formatDateTime } from "./format";

type OrderRecord = {
  id: string;
  tier_key: string;
  tier_label: string;
  total: number;
  gross_amount?: number | null;
  payment_type?: string | null;
  transaction_id?: string | null;
  paid_at?: string | null;
  status: string;
  name: string;
  nim: string;
  email: string;
  discount_code?: string | null;
  discount_percent?: number | null;
  created_at: string;
};

type DiscountRecord = {
  id: string;
  code: string;
  percent_off: number;
  description?: string | null;
  active: boolean;
  max_uses?: number | null;
  usage_count?: number | null;
  expires_at?: string | null;
  created_at: string;
};

type AttendanceRecord = {
  id: string;
  ticket_code: string;
  attendee_name: string | null;
  checked_in_at: string;
  checked_in_by: string | null;
};

type NewDiscountState = {
  code: string;
  percentOff: string;
  description: string;
  maxUses: string;
  expiresAt: string;
};

const initialDiscountState: NewDiscountState = {
  code: "",
  percentOff: "",
  description: "",
  maxUses: "",
  expiresAt: "",
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [ordersPage, setOrdersPage] = useState(1);
  const ordersPageSize = 10;
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPendingTotal, setOrdersPendingTotal] = useState(0);
  const [ordersRevenue, setOrdersRevenue] = useState(0);

  const [discounts, setDiscounts] = useState<DiscountRecord[]>([]);
  const [discountsLoading, setDiscountsLoading] = useState(false);
  const [discountsError, setDiscountsError] = useState<string | null>(null);
  const [discountsPage, setDiscountsPage] = useState(1);
  const discountsPageSize = 10;
  const [discountsTotal, setDiscountsTotal] = useState(0);
  const [activeDiscountsTotal, setActiveDiscountsTotal] = useState(0);
  const [mutatingDiscountId, setMutatingDiscountId] = useState<string | null>(
    null,
  );

  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [attendancesLoading, setAttendancesLoading] = useState(false);
  const [attendancesError, setAttendancesError] = useState<string | null>(null);
  const [attendancesPage, setAttendancesPage] = useState(1);
  const attendancesPageSize = 10;
  const [attendancesTotal, setAttendancesTotal] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogState, setDialogState] =
    useState<NewDiscountState>(initialDiscountState);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [dialogSubmitting, setDialogSubmitting] = useState(false);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const { rows, total, pending, revenue } = await fetchOrdersAction(
        ordersPage,
        ordersPageSize,
      );
      setOrders(
        rows.map((row) => ({
          id: row.id,
          tier_key: row.tierKey,
          tier_label: row.tierLabel,
          total: row.total,
          gross_amount: row.grossAmount,
          payment_type: row.paymentType,
          status: row.status,
          name: row.name,
          nim: row.nim,
          email: row.email,
          discount_code: row.discountCode,
          discount_percent: row.discountPercent,
          created_at: row.createdAt,
        })),
      );
      setOrdersTotal(total);
      setOrdersPendingTotal(pending);
      setOrdersRevenue(revenue);
      setOrdersError(null);
    } catch (error) {
      console.error(error);
      setOrdersError(
        error instanceof Error ? error.message : "Failed to load orders",
      );
    } finally {
      setOrdersLoading(false);
    }
  }, [ordersPage]);

  const loadDiscounts = useCallback(async () => {
    setDiscountsLoading(true);
    try {
      const { rows, total, active } = await fetchDiscountsAction(
        discountsPage,
        discountsPageSize,
      );
      setDiscounts(
        rows.map((row) => ({
          id: row.id,
          code: row.code,
          percent_off: row.percentOff,
          description: row.description,
          active: row.active,
          max_uses: row.maxUses,
          usage_count: row.usageCount,
          expires_at: row.expiresAt,
          created_at: row.createdAt,
        })),
      );
      setDiscountsTotal(total);
      setActiveDiscountsTotal(active);
      setDiscountsError(null);
    } catch (error) {
      console.error(error);
      setDiscountsError(
        error instanceof Error ? error.message : "Failed to load discounts",
      );
    } finally {
      setDiscountsLoading(false);
    }
  }, [discountsPage]);

  const loadAttendances = useCallback(async () => {
    setAttendancesLoading(true);
    try {
      const { rows, total } = await fetchAttendancesAction(
        attendancesPage,
        attendancesPageSize,
      );
      setAttendances(
        rows.map((row) => ({
          id: row.id,
          ticket_code: row.ticketCode,
          attendee_name: row.attendeeName,
          checked_in_at: row.checkedInAt,
          checked_in_by: row.checkedInBy,
        })),
      );
      setAttendancesTotal(total);
      setAttendancesError(null);
    } catch (error) {
      console.error(error);
      setAttendancesError(
        error instanceof Error
          ? error.message
          : "Failed to load attendance records",
      );
    } finally {
      setAttendancesLoading(false);
    }
  }, [attendancesPage]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    void loadDiscounts();
  }, [loadDiscounts]);

  useEffect(() => {
    void loadAttendances();
  }, [loadAttendances]);

  const totalOrders = ordersTotal;
  const pendingOrders = ordersPendingTotal;
  const totalRevenue = ordersRevenue;
  const activeDiscounts = activeDiscountsTotal;
  const checkedInCount = attendancesTotal;

  const handleRefreshAll = useCallback(() => {
    void loadOrders();
    void loadDiscounts();
    void loadAttendances();
  }, [loadOrders, loadDiscounts, loadAttendances]);

  const handleToggleDiscount = useCallback(
    async (discount: DiscountRecord) => {
      setMutatingDiscountId(discount.id);
      try {
        const res = await fetch(`/api/discounts/${discount.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: !discount.active }),
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          throw new Error(payload?.error ?? "Failed to update discount");
        }
        await loadDiscounts();
      } catch (error) {
        console.error(error);
        setDiscountsError(
          error instanceof Error ? error.message : "Failed to update discount",
        );
      } finally {
        setMutatingDiscountId(null);
      }
    },
    [loadDiscounts],
  );

  const handleDeleteDiscount = useCallback(
    async (discount: DiscountRecord) => {
      if (!window.confirm(`Delete discount ${discount.code}?`)) return;
      setMutatingDiscountId(discount.id);
      try {
        const res = await fetch(`/api/discounts/${discount.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          throw new Error(payload?.error ?? "Failed to delete discount");
        }
        await loadDiscounts();
      } catch (error) {
        console.error(error);
        setDiscountsError(
          error instanceof Error ? error.message : "Failed to delete discount",
        );
      } finally {
        setMutatingDiscountId(null);
      }
    },
    [loadDiscounts],
  );

  const resetDialog = useCallback(() => {
    setDialogState(initialDiscountState);
    setDialogError(null);
    setDialogSubmitting(false);
  }, []);

  const handleCreateDiscount = useCallback(
    async (state: NewDiscountState) => {
      setDialogSubmitting(true);
      setDialogError(null);
      try {
        const percent = Number(state.percentOff);
        if (Number.isNaN(percent) || percent < 0 || percent > 100) {
          throw new Error("Percent must be between 0 and 100");
        }

        const maxUsesValue = state.maxUses ? Number(state.maxUses) : null;
        if (
          maxUsesValue !== null &&
          (!Number.isInteger(maxUsesValue) || maxUsesValue <= 0)
        ) {
          throw new Error("Max uses must be a positive integer");
        }

        const payload = {
          code: state.code,
          percentOff: percent,
          description: state.description || null,
          maxUses: maxUsesValue,
          expiresAt: state.expiresAt || null,
        };

        const res = await fetch("/api/discounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? "Failed to create discount");
        }

        await loadDiscounts();
        resetDialog();
        setDialogOpen(false);
      } catch (error) {
        console.error(error);
        setDialogError(
          error instanceof Error ? error.message : "Failed to create discount",
        );
      } finally {
        setDialogSubmitting(false);
      }
    },
    [loadDiscounts, resetDialog],
  );

  return (
    <div className="flex flex-col gap-6 m-4">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Ticketing Admin
          </h1>
          <p className="text-muted-foreground text-sm">
            Monitor Midtrans orders, Supabase snapshots, and discount rules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefreshAll}
            disabled={ordersLoading || discountsLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <DiscountDialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                resetDialog();
              }
            }}
            state={dialogState}
            onChange={setDialogState}
            onSubmit={() => void handleCreateDiscount(dialogState)}
            submitting={dialogSubmitting}
            error={dialogError}
          />
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <KpiCard
          icon={<ShoppingCartIcon className="size-4" />}
          label="Orders"
          value={totalOrders.toString()}
        />
        <KpiCard
          icon={<TicketIcon className="size-4" />}
          label="Pending"
          value={pendingOrders.toString()}
        />
        <KpiCard
          icon={<WalletIcon className="size-4" />}
          label="Revenue (IDR)"
          value={formatCurrency(totalRevenue, "IDR")}
        />
        <KpiCard
          icon={<BadgePercent className="size-4" />}
          label="Active Discounts"
          value={activeDiscounts.toString()}
        />
        <KpiCard
          icon={<TicketIcon className="size-4" />}
          label="Checked-in"
          value={checkedInCount.toString()}
        />
      </section>

      <Link
        href="/admin/qr"
        className="rounded-lg border p-4 bg-background hover:bg-muted transition-colors"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <QrCodeIcon className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Scan</span>
            <span className="font-semibold">QR Ticket</span>
          </div>
          <Button size="sm" variant="outline">
            Open Scanner
          </Button>
        </div>
      </Link>

      <section className="rounded-lg border bg-background p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <p className="text-xs text-muted-foreground">
              Data is pulled from Supabase `orders` with the latest entries
              first.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void loadOrders()}
            disabled={ordersLoading}
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
        <Separator className="my-3" />
        {ordersError ? (
          <p className="text-sm text-destructive">{ordersError}</p>
        ) : null}
        <div className="overflow-x-auto">
          <Table>
            <TableCaption>
              {ordersLoading
                ? "Loading orders…"
                : orders.length === 0
                  ? "No orders recorded yet."
                  : "Most recent transactions."}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Gross Amount</TableHead>
                <TableHead>Payment Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const normalizedStatus = order.status.toLowerCase();
                const isPaid = normalizedStatus === "paid";
                const toneClass =
                  normalizedStatus === "paid"
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : normalizedStatus === "pending"
                      ? "border-amber-500/30 bg-amber-500/10"
                      : "border-red-500/30 bg-red-500/10";
                const paymentLabel = order.payment_type
                  ? order.payment_type.replace(/_/g, " ")
                  : null;
                const totalDisplay = formatCurrency(order.total ?? 0, "IDR");
                const grossDisplay = formatCurrency(
                  order.gross_amount ?? order.total ?? 0,
                  "IDR",
                );

                return (
                  <TableRow key={order.id}>
                    <TableCell className="align-top">
                      <div
                        className={`flex flex-col items-start gap-2 rounded-md border p-3 ${toneClass}`}
                      >
                        {isPaid ? (
                          <>
                            <span className="font-mono break-all text-xs">
                              {order.id}
                            </span>
                            <Image
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(order.id)}`}
                              alt={`QR code for order ${order.id}`}
                              width={120}
                              height={120}
                              className="rounded border bg-white p-1"
                            />
                          </>
                        ) : (
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <p className="font-medium text-foreground">
                              Pending payment
                            </p>
                            <p>QR and UUID unlock after settlement.</p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {order.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {order.email}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          NIM {order.nim}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {order.tier_label}
                        </span>
                        <span className="text-[10px] uppercase text-muted-foreground">
                          {order.tier_key}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold">
                        {totalDisplay}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold">
                        {grossDisplay}
                      </span>
                    </TableCell>
                    <TableCell>
                      {paymentLabel ? (
                        <span className="text-xs font-medium uppercase">
                          {paymentLabel}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
                      {order.discount_code ? (
                        <span className="text-xs font-medium">
                          {order.discount_code} · {order.discount_percent ?? 0}%
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(order.created_at)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <PaginationControls
          page={ordersPage}
          pageSize={ordersPageSize}
          total={ordersTotal}
          onPageChange={(next) => setOrdersPage(next)}
          disabled={ordersLoading}
        />
      </section>

      <section className="rounded-lg border bg-background p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Discount Codes</h2>
            <p className="text-xs text-muted-foreground">
              Manage Supabase `discount_codes` entries.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void loadDiscounts()}
            disabled={discountsLoading}
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
        <Separator className="my-3" />
        {discountsError ? (
          <p className="text-sm text-destructive">{discountsError}</p>
        ) : null}
        <div className="overflow-x-auto">
          <Table>
            <TableCaption>
              {discountsLoading
                ? "Loading discount codes…"
                : discounts.length === 0
                  ? "No discount codes configured."
                  : "Active and archived discount rules."}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Percent</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Max Uses</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discounts.map((discount) => {
                const isMutating = mutatingDiscountId === discount.id;
                return (
                  <TableRow key={discount.id}>
                    <TableCell className="font-mono text-xs">
                      {discount.code}
                    </TableCell>
                    <TableCell className="text-sm font-semibold">
                      {discount.percent_off}%
                    </TableCell>
                    <TableCell className="text-xs">
                      {discount.usage_count ?? 0}
                    </TableCell>
                    <TableCell className="text-xs">
                      {discount.max_uses ?? "∞"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {discount.expires_at
                        ? formatDateTime(discount.expires_at)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate">
                      {discount.description ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant={discount.active ? "outline" : "default"}
                          onClick={() => void handleToggleDiscount(discount)}
                          disabled={isMutating}
                        >
                          {isMutating ? (
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          ) : discount.active ? (
                            <PowerIcon className="mr-2 h-3.5 w-3.5" />
                          ) : (
                            <PowerIcon className="mr-2 h-3.5 w-3.5" />
                          )}
                          {discount.active ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => void handleDeleteDiscount(discount)}
                          disabled={isMutating}
                        >
                          {isMutating ? (
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <PaginationControls
          page={discountsPage}
          pageSize={discountsPageSize}
          total={discountsTotal}
          onPageChange={(next) => setDiscountsPage(next)}
          disabled={discountsLoading}
        />
      </section>

      <section className="rounded-lg border bg-background p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Attendance</h2>
            <p className="text-xs text-muted-foreground">
              Records from the `event` table (ticket check-ins).
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void loadAttendances()}
            disabled={attendancesLoading}
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
        <Separator className="my-3" />
        {attendancesError ? (
          <p className="text-sm text-destructive">{attendancesError}</p>
        ) : null}
        <div className="overflow-x-auto">
          <Table>
            <TableCaption>
              {attendancesLoading
                ? "Loading attendance records…"
                : attendances.length === 0
                  ? "No check-ins recorded yet."
                  : "Latest attendance rows."}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Attendee</TableHead>
                <TableHead>Checked-in</TableHead>
                <TableHead>Operator</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendances.map((record) => (
                <TableRow key={`${record.id}-${record.checked_in_at}`}>
                  <TableCell className="font-mono text-xs">
                    {record.ticket_code}
                  </TableCell>
                  <TableCell className="text-sm">
                    {record.attendee_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(record.checked_in_at)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {record.checked_in_by ?? "system"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <PaginationControls
          page={attendancesPage}
          pageSize={attendancesPageSize}
          total={attendancesTotal}
          onPageChange={(next) => setAttendancesPage(next)}
          disabled={attendancesLoading}
        />
      </section>
    </div>
  );
}

function PaginationControls({
  page,
  pageSize,
  total,
  onPageChange,
  disabled,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < pageCount;

  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs text-muted-foreground">
        Page {page} of {pageCount} • {total} rows
      </span>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={!canPrev || disabled}
        >
          Prev
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          disabled={!canNext || disabled}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground text-sm">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="mt-2 text-xl font-semibold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = status.toLowerCase();
  const base =
    "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium";
  const toneClass =
    tone === "paid"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : tone === "pending"
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
        : tone === "failed"
          ? "bg-red-500/15 text-red-600 dark:text-red-400"
          : "bg-muted text-muted-foreground";
  return <span className={`${base} ${toneClass}`}>{status}</span>;
}

function DiscountDialog({
  open,
  onOpenChange,
  state,
  onChange,
  onSubmit,
  submitting,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: NewDiscountState;
  onChange: Dispatch<SetStateAction<NewDiscountState>>;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <BadgePercent className="mr-2 h-4 w-4" /> New Discount
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Discount</DialogTitle>
          <DialogDescription>
            Add a Turnstile-protected discount code to Supabase.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="discount-code">Code</Label>
            <Input
              id="discount-code"
              value={state.code}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  code: event.target.value.toUpperCase(),
                }))
              }
              placeholder="E.g. EARLYBIRD"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="discount-percent">Percent (%)</Label>
            <Input
              id="discount-percent"
              type="number"
              min={0}
              max={100}
              value={state.percentOff}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  percentOff: event.target.value,
                }))
              }
              placeholder="10"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="discount-description">Description</Label>
            <Input
              id="discount-description"
              value={state.description}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Optional note"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="discount-max">Max Uses</Label>
            <Input
              id="discount-max"
              type="number"
              min={1}
              value={state.maxUses}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  maxUses: event.target.value,
                }))
              }
              placeholder="Leave empty for unlimited"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="discount-expires">Expires At</Label>
            <Input
              id="discount-expires"
              type="datetime-local"
              value={state.expiresAt}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  expiresAt: event.target.value,
                }))
              }
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
