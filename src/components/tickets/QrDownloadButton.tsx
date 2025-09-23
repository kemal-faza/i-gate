"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type QrDownloadButtonProps = {
  qrUrl: string;
  fileName: string;
  disabled?: boolean;
};

export function QrDownloadButton({
  qrUrl,
  fileName,
  disabled = false,
}: QrDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    if (disabled || isDownloading) return;
    try {
      setIsDownloading(true);
      const response = await fetch(qrUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch QR image (${response.status})`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Failed to download QR code", error);
      alert("Could not download the QR code. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full"
      disabled={disabled || isDownloading}
      onClick={handleDownload}
    >
      {isDownloading ? "Preparing…" : "Download QR"}
    </Button>
  );
}

export default QrDownloadButton;
