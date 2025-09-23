'use client';

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "../_components/format";
import {
  type AttendanceRow,
  getRecentAttendancesAction,
  type ScanTicketResult,
  scanTicketAction,
} from "./actions";

declare global {
  interface Window {
    jsQR?: (
      data: Uint8ClampedArray,
      width: number,
      height: number,
    ) => { data: string } | null;
  }
}

export default function QRScannerPage() {
	const videoRef = React.useRef<HTMLVideoElement | null>(null);
	const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
	const rafRef = React.useRef<number | null>(null);
	const streamRef = React.useRef<MediaStream | null>(null);
	const detectorRef = React.useRef<BarcodeDetector | null>(null);

  const [isSupported, setIsSupported] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [permissionError, setPermissionError] = React.useState<string | null>(
    null,
  );
  const [manualCode, setManualCode] = React.useState("");
  const [result, setResult] = React.useState<ScanTicketResult | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [attendances, setAttendances] = React.useState<AttendanceRow[]>([]);
  const [isLoadingAttendances, setIsLoadingAttendances] = React.useState(false);

  const stop = React.useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  React.useEffect(() => {
    const supported =
      typeof window !== "undefined" && "BarcodeDetector" in window;
    setIsSupported(supported);
    if (supported) {
      try {
        // @ts-expect-error - BarcodeDetector exists on supported browsers
        detectorRef.current = new window.BarcodeDetector({
          formats: ["qr_code"],
        });
      } catch {
        // @ts-expect-error - fallback without constructor options
        detectorRef.current = new window.BarcodeDetector();
      }
    }

    return () => {
      stop();
    };
  }, [stop]);

  React.useEffect(() => {
    if (isSupported) return;
    if (typeof window === "undefined") return;
    if (document.querySelector("script[data-jsqr]") || window.jsQR) return;

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
    script.async = true;
    script.setAttribute("data-jsqr", "true");
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [isSupported]);

  const loadAttendances = React.useCallback(async () => {
    setIsLoadingAttendances(true);
    try {
      const rows = await getRecentAttendancesAction();
      setAttendances(rows);
    } catch (error) {
      console.error("Failed to load attendance records", error);
    } finally {
      setIsLoadingAttendances(false);
    }
  }, []);

  React.useEffect(() => {
    void loadAttendances();
  }, [loadAttendances]);

  async function start() {
    setPermissionError(null);
    setResult(null);
    setDialogOpen(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionError("Camera API unsupported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        setPermissionError("Unable to access camera element.");
        return;
      }

      video.srcObject = stream;
      await video.play();
      setIsScanning(true);
      loop();
    } catch (error) {
      console.error("QRScanner start error", error);
      setPermissionError(
        error instanceof Error
          ? error.message
          : "Camera permission denied or unavailable. Try manual input.",
      );
      setIsScanning(false);
    }
  }

	function loop() {
		if (!videoRef.current) return;
		rafRef.current = requestAnimationFrame(loop);

    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (
      canvas.width !== video.videoWidth ||
      canvas.height !== video.videoHeight
    ) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (isProcessing) return;

    if (detectorRef.current) {
      detectorRef.current
        .detect(canvas)
        .then((codes) => {
          if (!codes || codes.length === 0) return;
          const raw =
            (codes[0] as { rawValue?: string })?.rawValue ??
            (codes[0] as { raw?: string })?.raw ??
            (typeof codes[0] === "string" ? codes[0] : "");
          if (raw) {
            void handleScan(String(raw));
          }
        })
        .catch(() => {
          // ignore detection errors to keep the loop alive
        });
    } else if (window.jsQR) {
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const decoded = window.jsQR(
          imageData.data,
          canvas.width,
          canvas.height,
        );
        if (decoded?.data) {
          void handleScan(String(decoded.data));
        }
      } catch (error) {
        console.debug("jsQR decode error", error);
      }
    }
  }

  async function handleScan(code: string) {
    if (isProcessing) return;
    setIsProcessing(true);
    stop();

    try {
      const response = await scanTicketAction(code);
      setResult(response);
      setDialogOpen(true);

      if (response.status === "success" || response.status === "already") {
        void loadAttendances();
      }
    } finally {
      setIsProcessing(false);
    }
  }

  function onManualCheck() {
    const trimmed = manualCode.trim();
    if (!trimmed) return;
    void handleScan(trimmed);
  }

  function resetAndRescan() {
    setDialogOpen(false);
    setResult(null);
    setManualCode("");
    setTimeout(() => {
      void start();
    }, 120);
  }

  const statusBadge = React.useMemo(() => {
    if (!result) return null;

    const tone =
      result.status === "success"
        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        : result.status === "already"
          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
          : result.status === "unpaid"
            ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
            : result.status === "not_found"
              ? "bg-red-500/15 text-red-600 dark:text-red-400"
              : "bg-red-500/15 text-red-600 dark:text-red-400";

    const label =
      result.status === "success"
        ? "Check-in recorded"
        : result.status === "already"
          ? "Already checked-in"
          : result.status === "unpaid"
            ? "Unpaid order"
            : result.status === "not_found"
              ? "Ticket not found"
              : "Error";

    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}
      >
        {label}
      </span>
    );
  }, [result]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">QR Attendance</h1>
        <p className="text-sm text-muted-foreground">
          Scan the ticket QR to mark attendance. Works on mobile and falls back
          to manual entry if needed.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <Card className="overflow-hidden border border-border/60">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Camera scanner</CardTitle>
              <p className="text-muted-foreground text-sm">
                Allow camera access, then point to the ticket QR code.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  isScanning
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-foreground/70"
                }`}
              >
                {isScanning ? "Scanning" : "Idle"}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            {!isSupported && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
                This browser does not expose native QR detection. Loading jsQR
                fallback…
              </div>
            )}

            {permissionError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
                {permissionError}
              </div>
            )}

            <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-black/70">
              <video
                ref={videoRef}
                className="h-full w-full object-contain"
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="pointer-events-none absolute left-0 top-0 h-full w-full opacity-0"
              />

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="rounded-2xl border-2 border-white/40 p-4">
                  <div className="rounded-xl border-2 border-white/60 p-8" />
                </div>
              </div>

              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm text-white">
                  Checking ticket…
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                size="sm"
                onClick={() => void start()}
                disabled={isScanning}
              >
                Start camera
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={stop}
                disabled={!isScanning}
              >
                Stop
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="border border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Manual ticket lookup</CardTitle>
              <p className="text-muted-foreground text-sm">
                Use this when the camera is unavailable. Paste the ticket UUID
                from the order email.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 pb-6">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="550e8400-e29b-41d4-a716-446655440000"
                  value={manualCode}
                  onChange={(event) => setManualCode(event.target.value)}
                  disabled={isProcessing}
                />
                <Button onClick={onManualCheck} disabled={isProcessing}>
                  Check
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: the ticket UUID is the same code shown in the admin orders
                table.
              </p>
              <Separator />
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  • Scans pause while we verify a ticket—tap "Start camera" to
                  resume.
                </p>
                <p>
                  • Each ticket can check in once. Re-scans show the existing
                  record.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Recent check-ins</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Latest attendance rows direct from Supabase.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void loadAttendances()}
                disabled={isLoadingAttendances}
              >
                {isLoadingAttendances ? "Refreshing…" : "Refresh"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pb-6">
              {attendances.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {isLoadingAttendances
                    ? "Loading attendance records…"
                    : "No attendees have checked in yet."}
                </p>
              ) : (
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket</TableHead>
                        <TableHead>Attendee</TableHead>
                        <TableHead>Checked-in</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendances.map((attendance) => (
                        <TableRow
                          key={`${attendance.ticketCode}-${attendance.checkedInAt}`}
                        >
                          <TableCell className="font-mono text-xs">
                            {attendance.ticketCode}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="font-medium">
                              {attendance.attendeeName ?? "—"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Checked by {attendance.checkedInBy ?? "system"}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDateTime(attendance.checkedInAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={dialogOpen && !!result}
        onOpenChange={(open) => setDialogOpen(open)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader className="space-y-3">
            <div className="flex flex-col gap-2">
              {statusBadge}
              <DialogTitle className="text-lg font-semibold">
                {result?.status === "success"
                  ? "Attendance stored"
                  : result?.status === "already"
                    ? "Ticket already checked-in"
                    : result?.status === "unpaid"
                      ? "Payment pending"
                      : result?.status === "not_found"
                        ? "Ticket not found"
                        : "Scan error"}
              </DialogTitle>
            </div>
            <DialogDescription asChild>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                {result?.code ? (
                  <div>
                    <span className="text-xs uppercase text-muted-foreground">
                      Ticket code
                    </span>
                    <div className="font-mono text-sm">{result.code}</div>
                  </div>
                ) : null}

                {result && "attendee" in result && result.attendee ? (
                  <div className="rounded-md bg-muted/50 p-3">
                    <div className="text-sm font-medium text-foreground">
                      {result.attendee.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {result.attendee.email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      NIM {result.attendee.nim} • {result.attendee.tierLabel}
                    </div>
                    {result.checkedInAt ? (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Last check-in: {formatDateTime(result.checkedInAt)}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {result?.status === "unpaid" ? (
                  <p>
                    Please ask the attendee to complete payment before allowing
                    entry.
                  </p>
                ) : null}

                {result?.status === "not_found" ? (
                  <p>The scanned code does not match any issued ticket.</p>
                ) : null}

                {result?.status === "error" ? <p>{result.message}</p> : null}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
              }}
            >
              Close
            </Button>
            <Button onClick={resetAndRescan}>Scan next ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
