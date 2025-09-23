'use client';

import React from 'react';
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	customers,
	orders,
	tickets,
	events,
	ORDER_STATUSES,
	TICKET_STATUSES,
	PROVIDERS,
} from '../_data/mock';
import { formatCurrency, formatDateTime, shortId, shortUuid } from './format';
import type {
	Customer,
	OrderRow,
	TicketRow,
	OrderStatus,
	TicketStatus,
} from './types';

function Toolbar({
	value,
	onChange,
	children,
}: {
	value: string;
	onChange: (v: string) => void;
	children?: React.ReactNode;
}) {
	return (
		<div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex items-center gap-2">
				<Input
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder="Search…"
					className="w-64"
				/>
				{children}
			</div>
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => onChange('')}>
					Clear
				</Button>
			</div>
		</div>
	);
}

function Pagination({
	total,
	page,
	pageSize,
	onPageChange,
	onPageSizeChange,
}: {
	total: number;
	page: number;
	pageSize: number;
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
}) {
	const pageCount = Math.max(1, Math.ceil(total / pageSize));
	const canPrev = page > 1;
	const canNext = page < pageCount;
	return (
		<div className="mt-3 flex items-center justify-between gap-3">
			<div className="text-xs text-muted-foreground">
				Page {page} of {pageCount} • {total} rows
			</div>
			<div className="flex items-center gap-2">
				<label className="text-xs text-muted-foreground">Rows</label>
				<select
					className="rounded-md border bg-background px-2 py-1 text-sm"
					value={pageSize}
					onChange={(e) =>
						onPageSizeChange(parseInt(e.target.value, 10))
					}>
					{[5, 10, 20, 50].map((n) => (
						<option
							key={n}
							value={n}>
							{n}
						</option>
					))}
				</select>
				<Button
					size="sm"
					variant="outline"
					onClick={() => onPageChange(page - 1)}
					disabled={!canPrev}>
					Prev
				</Button>
				<Button
					size="sm"
					variant="outline"
					onClick={() => onPageChange(page + 1)}
					disabled={!canNext}>
					Next
				</Button>
			</div>
		</div>
	);
}

function StatusBadge({
	label,
	tone = 'default',
}: {
	label: string;
	tone?: 'success' | 'warning' | 'destructive' | 'muted' | 'info' | 'default';
}) {
	const toneClass =
		tone === 'success'
			? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
			: tone === 'warning'
			? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
			: tone === 'destructive'
			? 'bg-red-500/15 text-red-600 dark:text-red-400'
			: tone === 'muted'
			? 'bg-muted text-foreground/70'
			: tone === 'info'
			? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
			: 'bg-secondary text-secondary-foreground';
	return (
		<span
			className={`inline-flex items-center rounded px-2 py-0.5 text-xs ${toneClass}`}>
			{label}
		</span>
	);
}

function toneForOrder(status: OrderStatus) {
	switch (status) {
		case 'paid':
			return 'success' as const;
		case 'pending':
			return 'warning' as const;
		case 'failed':
		case 'refunded':
			return 'destructive' as const;
		default:
			return 'muted' as const;
	}
}

function toneForTicket(status: TicketStatus) {
	switch (status) {
		case 'valid':
			return 'success' as const;
		case 'used':
			return 'muted' as const;
		case 'void':
			return 'destructive' as const;
		default:
			return 'muted' as const;
	}
}

/* Customers */
export function CustomersTable() {
	const [q, setQ] = React.useState('');
	const [page, setPage] = React.useState(1);
	const [pageSize, setPageSize] = React.useState(10);

	const filtered = React.useMemo(() => {
		const s = q.toLowerCase().trim();
		if (!s) return customers;
		return customers.filter(
			(c) =>
				c.name.toLowerCase().includes(s) ||
				c.email.toLowerCase().includes(s) ||
				c.nim.toLowerCase().includes(s) ||
				c.id.toLowerCase().includes(s),
		);
	}, [q]);

	const total = filtered.length;
	const start = (page - 1) * pageSize;
	const pageRows = filtered.slice(start, start + pageSize);

	React.useEffect(() => {
		setPage(1);
	}, [q, pageSize]);

	return (
		<div>
			<Toolbar
				value={q}
				onChange={setQ}
			/>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[90px]">ID</TableHead>
						<TableHead>Name</TableHead>
						<TableHead className="hidden md:table-cell">
							Email
						</TableHead>
						<TableHead className="hidden md:table-cell">
							NIM
						</TableHead>
						<TableHead className="hidden md:table-cell">
							Created
						</TableHead>
						<TableHead className="w-[160px] text-right">
							Actions
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{pageRows.map((c: Customer) => (
						<TableRow key={c.id}>
							<TableCell className="font-mono">
								{shortId(c.id, 2)}
							</TableCell>
							<TableCell>{c.name}</TableCell>
							<TableCell className="hidden md:table-cell">
								{c.email}
							</TableCell>
							<TableCell className="hidden md:table-cell">
								{c.nim}
							</TableCell>
							<TableCell className="hidden md:table-cell">
								{formatDateTime(c.created_at)}
							</TableCell>
							<TableCell className="text-right">
								<div className="flex justify-end gap-2">
									<Button
										size="sm"
										variant="outline"
										disabled>
										View
									</Button>
									<Button
										size="sm"
										variant="outline"
										disabled>
										Edit
									</Button>
									<Button
										size="sm"
										variant="destructive"
										disabled>
										Delete
									</Button>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
				<TableCaption>Customers (mock)</TableCaption>
			</Table>
			<Pagination
				total={total}
				page={page}
				pageSize={pageSize}
				onPageChange={setPage}
				onPageSizeChange={setPageSize}
			/>
		</div>
	);
}

/* Orders */
export function OrdersTable() {
	const [q, setQ] = React.useState('');
	const [status, setStatus] = React.useState<OrderStatus | ''>('');
	const [provider, setProvider] = React.useState<string | ''>('');
	const [page, setPage] = React.useState(1);
	const [pageSize, setPageSize] = React.useState(10);

	const customerById = React.useMemo(() => {
		const map = new Map<string, Customer>();
		for (const c of customers) map.set(c.id, c);
		return map;
	}, []);

	const rows: OrderRow[] = React.useMemo(() => {
		return orders.map((o) => {
			const c = customerById.get(o.customer_id);
			return {
				...o,
				customer_name: c?.name ?? '—',
				customer_email: c?.email ?? '—',
			};
		});
	}, [customerById]);

	const filtered = React.useMemo(() => {
		const s = q.toLowerCase().trim();
		return rows.filter((r) => {
			const matchesQ =
				!s ||
				r.id.toLowerCase().includes(s) ||
				r.customer_name?.toLowerCase().includes(s) ||
				r.customer_email?.toLowerCase().includes(s) ||
				r.provider.toLowerCase().includes(s);
			const matchesStatus = !status || r.status === status;
			const matchesProvider = !provider || r.provider === provider;
			return matchesQ && matchesStatus && matchesProvider;
		});
	}, [rows, q, status, provider]);

	const total = filtered.length;
	const start = (page - 1) * pageSize;
	const pageRows = filtered.slice(start, start + pageSize);

	React.useEffect(() => {
		setPage(1);
	}, [q, status, provider, pageSize]);

	return (
		<div>
			<Toolbar
				value={q}
				onChange={setQ}>
				<select
					className="rounded-md border bg-background px-2 py-1 text-sm"
					value={status}
					onChange={(e) =>
						setStatus((e.target.value as OrderStatus) || '')
					}>
					<option value="">Status: All</option>
					{ORDER_STATUSES.map((s) => (
						<option
							key={s}
							value={s}>
							{s}
						</option>
					))}
				</select>
				<select
					className="rounded-md border bg-background px-2 py-1 text-sm"
					value={provider}
					onChange={(e) => setProvider(e.target.value || '')}>
					<option value="">Provider: All</option>
					{PROVIDERS.map((p) => (
						<option
							key={p}
							value={p}>
							{p}
						</option>
					))}
				</select>
			</Toolbar>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[90px]">ID</TableHead>
						<TableHead>Customer</TableHead>
						<TableHead className="hidden md:table-cell">
							Amount
						</TableHead>
						<TableHead className="hidden md:table-cell">
							Provider
						</TableHead>
						<TableHead>Status</TableHead>
						<TableHead className="hidden md:table-cell">
							Created
						</TableHead>
						<TableHead className="w-[220px] text-right">
							Actions
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{pageRows.map((o) => (
						<TableRow key={o.id}>
							<TableCell className="font-mono">
								{shortId(o.id, 2)}
							</TableCell>
							<TableCell>
								<div className="flex flex-col">
									<span>{o.customer_name}</span>
									<span className="text-xs text-muted-foreground">
										{o.customer_email}
									</span>
								</div>
							</TableCell>
							<TableCell className="hidden md:table-cell">
								{formatCurrency(o.amount, o.currency)}
							</TableCell>
							<TableCell className="hidden md:table-cell">
								<span className="uppercase">{o.provider}</span>
							</TableCell>
							<TableCell>
								<StatusBadge
									label={o.status}
									tone={toneForOrder(o.status)}
								/>
							</TableCell>
							<TableCell className="hidden md:table-cell">
								{formatDateTime(o.created_at)}
							</TableCell>
							<TableCell className="text-right">
								<div className="flex justify-end gap-2">
									<Button
										size="sm"
										variant="outline"
										disabled>
										View
									</Button>
									<Button
										size="sm"
										variant="outline"
										disabled>
										Edit
									</Button>
									<Button
										size="sm"
										variant="destructive"
										disabled>
										Refund
									</Button>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
				<TableCaption>Orders (mock)</TableCaption>
			</Table>
			<Pagination
				total={total}
				page={page}
				pageSize={pageSize}
				onPageChange={setPage}
				onPageSizeChange={setPageSize}
			/>
		</div>
	);
}

/* Tickets */
export function TicketsTable() {
	const [q, setQ] = React.useState('');
	const [status, setStatus] = React.useState<TicketStatus | ''>('');
	const [page, setPage] = React.useState(1);
	const [pageSize, setPageSize] = React.useState(10);

	const eventNameById = React.useMemo(() => {
		const map = new Map<string, string>();
		for (const e of events) map.set(e.id, e.name);
		return map;
	}, []);

	const rows: TicketRow[] = React.useMemo(() => {
		return tickets.map((t) => ({
			...t,
			event_name: eventNameById.get(t.event_id) ?? '—',
		}));
	}, [eventNameById]);

	const filtered = React.useMemo(() => {
		const s = q.toLowerCase().trim();
		return rows.filter((r) => {
			const matchesQ =
				!s ||
				r.id.toLowerCase().includes(s) ||
				r.ticket_code.toLowerCase().includes(s) ||
				r.event_name?.toLowerCase().includes(s);
			const matchesStatus = !status || r.status === status;
			return matchesQ && matchesStatus;
		});
	}, [rows, q, status]);

	const total = filtered.length;
	const start = (page - 1) * pageSize;
	const pageRows = filtered.slice(start, start + pageSize);

	React.useEffect(() => {
		setPage(1);
	}, [q, status, pageSize]);

	return (
		<div>
			<Toolbar
				value={q}
				onChange={setQ}>
				<select
					className="rounded-md border bg-background px-2 py-1 text-sm"
					value={status}
					onChange={(e) =>
						setStatus((e.target.value as TicketStatus) || '')
					}>
					<option value="">Status: All</option>
					{TICKET_STATUSES.map((s) => (
						<option
							key={s}
							value={s}>
							{s}
						</option>
					))}
				</select>
			</Toolbar>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[90px]">ID</TableHead>
						<TableHead className="hidden md:table-cell">
							QR
						</TableHead>
						<TableHead>Ticket Code</TableHead>
						<TableHead className="hidden md:table-cell">
							Event
						</TableHead>
						<TableHead>Status</TableHead>
						<TableHead className="hidden md:table-cell">
							Issued
						</TableHead>
						<TableHead className="hidden md:table-cell">
							Used
						</TableHead>
						<TableHead className="w-[240px] text-right">
							Actions
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{pageRows.map((t) => (
						<TableRow key={t.id}>
							<TableCell className="font-mono">
								{shortId(t.id, 2)}
							</TableCell>
							<TableCell className="hidden md:table-cell">
								<div className="grid size-10 place-items-center rounded bg-muted font-mono text-[10px]">
									{shortUuid(t.ticket_code)}
								</div>
							</TableCell>
							<TableCell className="font-mono">
								{t.ticket_code}
							</TableCell>
							<TableCell className="hidden md:table-cell">
								{t.event_name}
							</TableCell>
							<TableCell>
								<StatusBadge
									label={t.status}
									tone={toneForTicket(t.status)}
								/>
							</TableCell>
							<TableCell className="hidden md:table-cell">
								{formatDateTime(t.issued_at)}
							</TableCell>
							<TableCell className="hidden md:table-cell">
								{t.used_at ? formatDateTime(t.used_at) : '—'}
							</TableCell>
							<TableCell className="text-right">
								<div className="flex justify-end gap-2">
									<Button
										size="sm"
										variant="outline"
										disabled>
										View
									</Button>
									<Button
										size="sm"
										variant="outline"
										disabled>
										Mark Used
									</Button>
									<Button
										size="sm"
										variant="destructive"
										disabled>
										Void
									</Button>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
				<TableCaption>Tickets (mock)</TableCaption>
			</Table>
			<Pagination
				total={total}
				page={page}
				pageSize={pageSize}
				onPageChange={setPage}
				onPageSizeChange={setPageSize}
			/>
		</div>
	);
}

/* Events */
export function EventsTable() {
	const [q, setQ] = React.useState('');
	const [page, setPage] = React.useState(1);
	const [pageSize, setPageSize] = React.useState(10);

	const filtered = React.useMemo(() => {
		const s = q.toLowerCase().trim();
		if (!s) return events;
		return events.filter(
			(e) =>
				e.name.toLowerCase().includes(s) ||
				e.venue.toLowerCase().includes(s) ||
				e.id.toLowerCase().includes(s),
		);
	}, [q]);

	const total = filtered.length;
	const start = (page - 1) * pageSize;
	const pageRows = filtered.slice(start, start + pageSize);

	React.useEffect(() => {
		setPage(1);
	}, [q, pageSize]);

	return (
		<div>
			<Toolbar
				value={q}
				onChange={setQ}
			/>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[90px]">ID</TableHead>
						<TableHead>Name</TableHead>
						<TableHead className="hidden md:table-cell">
							Starts
						</TableHead>
						<TableHead className="hidden md:table-cell">
							Venue
						</TableHead>
						<TableHead className="w-[160px] text-right">
							Actions
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{pageRows.map((e) => (
						<TableRow key={e.id}>
							<TableCell className="font-mono">
								{shortId(e.id, 2)}
							</TableCell>
							<TableCell>{e.name}</TableCell>
							<TableCell className="hidden md:table-cell">
								{formatDateTime(e.starts_at)}
							</TableCell>
							<TableCell className="hidden md:table-cell">
								{e.venue}
							</TableCell>
							<TableCell className="text-right">
								<div className="flex justify-end gap-2">
									<Button
										size="sm"
										variant="outline"
										disabled>
										View
									</Button>
									<Button
										size="sm"
										variant="outline"
										disabled>
										Edit
									</Button>
									<Button
										size="sm"
										variant="destructive"
										disabled>
										Delete
									</Button>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
				<TableCaption>Events (mock)</TableCaption>
			</Table>
			<Pagination
				total={total}
				page={page}
				pageSize={pageSize}
				onPageChange={setPage}
				onPageSizeChange={setPageSize}
			/>
		</div>
	);
}
