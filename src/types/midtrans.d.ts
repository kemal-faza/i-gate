declare module "midtrans-client";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (...args: any[]) => void;
          onPending?: (...args: any[]) => void;
          onError?: (...args: any[]) => void;
          onClose?: (...args: any[]) => void;
        }
      ) => void;
    };
  }
}

export {};
