export default function BackgroundGrid() {
  return (
    <div
      aria-hidden
      className="
        fixed inset-0 -z-10 pointer-events-none opacity-30
        [background-image:linear-gradient(var(--grid-color)_1px,transparent_1px),linear-gradient(90deg,var(--grid-color)_1px,transparent_1px)]
        [background-size:60px_60px]
      "
    />
  );
}
