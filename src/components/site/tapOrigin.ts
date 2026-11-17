// Remembers where the visitor last tapped/clicked so panels can open from that exact spot.
let last: { x: number; y: number } | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", (e) => { last = { x: e.clientX, y: e.clientY }; }, { capture: true, passive: true });
}
const curtain = [0.76, 0, 0.24, 1];
/** Circular "portal" reveal that grows from the last tap point. Falls back to a fade for reduced motion. */
export function circleReveal() {
  if (typeof window === "undefined") return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
  const x = last?.x ?? window.innerWidth / 2, y = last?.y ?? window.innerHeight / 2;
  return {
    initial: { clipPath: `circle(0% at ${x}px ${y}px)` },
    animate: { clipPath: `circle(150% at ${x}px ${y}px)`, transition: { duration: 0.8, ease: curtain } },
    exit: { clipPath: `circle(0% at ${x}px ${y}px)`, transition: { duration: 0.5, ease: curtain } },
  };
}
