import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <section className="relative h-[100svh] w-full overflow-hidden">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-black/40 md:bg-black/50" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_60%)]" />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-wide text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]">
            ✨ I GATE 2025 ✨
          </h1>

          <p className="mt-4 max-w-2xl mx-auto text-white/90 text-base md:text-lg leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">
            Wadah kebersamaan Informatika — merayakan prestasi, persahabatan,
            dan kreativitas dalam satu panggung spektakuler.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              <Link href="#" aria-label="About">
                about
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              className="shadow-lg bg-white text-black hover:bg-white/90 dark:bg-white dark:text-black"
            >
              <Link href="/tickets" aria-label="Tickets">
                tickets
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
