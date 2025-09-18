// Minimal types for Barcode Detector API

declare class BarcodeDetector {
  constructor(options?: { formats?: string[] });
  detect(
    source: CanvasImageSource
  ): Promise<Array<{ rawValue?: string; raw?: string }>>;
  static getSupportedFormats?(): Promise<string[]>;
}

interface Window {
  BarcodeDetector?: typeof BarcodeDetector;
}
