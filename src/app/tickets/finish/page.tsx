import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TicketFinishFallbackPage() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Payment Attempt Recorded
        </h1>
        <p className="text-muted-foreground text-base md:text-lg">
          Thanks for completing the payment flow. If you have an order ID, you
          can paste it below to review the status.
        </p>
      </div>
      <Button asChild>
        <Link href="/tickets">Back to tickets</Link>
      </Button>
    </div>
  );
}
