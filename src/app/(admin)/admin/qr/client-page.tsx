"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { tickets, orders } from "../_data/mock";

type ScanResult = "valid" | "not_found" | "not_payed";

export default function QRScannerPage() {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const detectorRef = React.useRef<BarcodeDetector | null>(null);

  const [isSupported, setIsSupported] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [permissionError, setPermissionError] = React.useState<string | null>(
    null
  );

  const [manualCode, setManualCode] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [result, setResult] = React.useState<{
    kind: ScanResult;
    code?: string;
  }>({ kind: "not_found" });

  React.useEffect(() => {
    setIsSupported(
      typeof window !== "undefined" && "BarcodeDetector" in window
    );
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        // @ts-expect-error - BarcodeDetector exists in supported browsers
        detectorRef.current = new window.BarcodeDetector({
          formats: ["qr_code"],
        });
      } catch {
        // Some older implementations require no constructor options
        // @ts-expect-error
        detectorRef.current = new window.BarcodeDetector();
      }
    }
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stop() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }

  async function start() {
    setPermissionError(null);
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
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setIsScanning(true);
      loop();
    } catch (err: any) {
      setPermissionError(
        err?.message ??
          "Camera permission denied or unavailable. Try manual input."
      );
      setIsScanning(false);
    }
  }

  function loop() {
    if (!videoRef.current) return;
    rafRef.current = requestAnimationFrame(loop);

    const v = videoRef.current!;
    if (!v.videoWidth || !v.videoHeight) return;

    const canvas = canvasRef.current!;
    if (!canvas) return;

    // Sync canvas size with video
    if (canvas.width !== v.videoWidth || canvas.height !== v.videoHeight) {
      canvas.width = v.videoWidth;
      canvas.height = v.videoHeight;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);

    if (detectorRef.current) {
      // Try detect; don't await long to keep UI smooth
      detectorRef
        .current!.detect(canvas)
        .then((codes: any[]) => {
          if (!codes || codes.length === 0) return;
          const raw =
            codes[0]?.rawValue ??
            codes[0]?.raw ??
            (typeof codes[0] === "string" ? codes[0] : "");
          if (raw) {
            onDetected(String(raw));
          }
        })
        .catch(() => {
          // Ignore detector errors during scanning loop
        });
    }
  }

  function onDetected(code: string) {
    // Debounce: pause scanning briefly
    if (isScanning) {
      stop();
    }
    evaluateCode(code);
  }

  function evaluateCode(code: string) {
    const ticket = tickets.find((t) => t.ticket_code === code);
    if (!ticket) {
      setResult({ kind: "not_found", code });
      setOpen(true);
      return;
    }
    const order = orders.find((o) => o.id === ticket.order_id);
    if (!order || order.status !== "paid") {
      setResult({ kind: "not_payed", code });
      setOpen(true);
      return;
    }
    setResult({ kind: "valid", code });
    setOpen(true);
  }

  function onManualCheck() {
    if (!manualCode.trim()) return;
    evaluateCode(manualCode.trim());
  }

  function resetScan() {
    setOpen(false);
    // restart scanning if camera available
    if (streamRef.current || navigator.mediaDevices) {
      start();
    }
  }

  return (
    <div className="m-4 flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Scan QR Ticket
        </h1>
        <p className="text-sm text-muted-foreground">
          Point the camera at a ticket QR code, or enter the code manually.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Camera</span>
            <div className="flex items-center gap-2">
              <span
                className={[
                  "inline-flex items-center rounded px-2 py-0.5 text-xs",
                  isScanning
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-foreground/70",
                ].join(" ")}
              >
                {isScanning ? "Scanning" : "Idle"}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={start}
                disabled={isScanning}
              >
                Start
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
          </div>

          {!isSupported && (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
              QR detection is not supported in this browser. Use manual input
              below.
            </div>
          )}

          {permissionError && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
              {permissionError}
            </div>
          )}

          <div className="mt-3 relative aspect-video w-full overflow-hidden rounded-md border bg-black/80">
            <video
              ref={videoRef}
              className="h-full w-full object-contain"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="absolute left-0 top-0 h-full w-full opacity-0"
            />
            <div className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-white/20" />
          </div>
        </div>

        <div className="rounded-lg border p-3">
          <div className="text-sm text-muted-foreground mb-2">Manual code</div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Paste or type ticket_code (UUID)"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
            <Button onClick={onManualCheck}>Check</Button>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Example: 550e8400-e29b-41d4-a716-446655440000
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {result.kind === "valid"
                ? "true"
                : result.kind === "not_found"
                ? "not found"
                : "not payed"}
            </DialogTitle>
            <DialogDescription>
              {result.code ? (
                <span className="font-mono text-xs">{result.code}</span>
              ) : (
                "—"
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
              }}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                resetScan();
              }}
            >
              Scan Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
