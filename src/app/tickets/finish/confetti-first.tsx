// app/ticket/finish/ConfettiOnce.tsx  (Client Component)
"use client";

import { useEffect } from "react";

export default function ConfettiOnce({ first }: { first: string | null }) {
  useEffect(() => {
    if (!first) return;

    let raf = 0;
    let stopped = false;
    const end = Date.now() + 3_000; // 3 seconds

    (async () => {
      const confetti = (await import("canvas-confetti")).default;
      const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

      const frame = () => {
        if (Date.now() > end || stopped) return;
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          startVelocity: 60,
          origin: { x: 0, y: 0.5 },
          colors,
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          startVelocity: 60,
          origin: { x: 1, y: 0.5 },
          colors,
        });
        raf = requestAnimationFrame(frame);
      };

      frame();
    })();

    return () => {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [first]);

  return null;
}
