// @ts-nocheck
import { useEffect } from "react";

const colors = ["#2ec4f1", "#3b4fa8", "#7a3a93", "#e5237b", "#ee3333"];

/** Site-wide touch & cursor effects: colour burst on every tap, ripple inside buttons,
 *  magnetic buttons and a trailing cursor ring on desktop. Skipped for reduced motion. */
export default function TouchFX() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const layer = document.createElement("div");
    layer.className = "fx-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);

    const onDown = (e) => {
      const t = e.target;
      if (t.closest?.("input,textarea,select,label")) return;
      const burst = document.createElement("span");
      burst.className = "fx-burst";
      burst.style.left = e.clientX + "px";
      burst.style.top = e.clientY + "px";
      burst.appendChild(Object.assign(document.createElement("i"), { className: "fx-ring" }));
      for (let i = 0; i < 12; i++) {
        const p = document.createElement("b");
        const a = (i / 12) * Math.PI * 2 + Math.random() * 0.5;
        const d = 30 + Math.random() * 38;
        p.style.setProperty("--dx", Math.cos(a) * d + "px");
        p.style.setProperty("--dy", Math.sin(a) * d + "px");
        p.style.background = colors[i % colors.length];
        burst.appendChild(p);
      }
      layer.appendChild(burst);
      setTimeout(() => burst.remove(), 900);

      const btn = t.closest?.(".button");
      if (btn) {
        const r = btn.getBoundingClientRect();
        const rip = document.createElement("span");
        rip.className = "fx-ripple";
        const s = Math.max(r.width, r.height) * 2.2;
        Object.assign(rip.style, { width: s + "px", height: s + "px", left: e.clientX - r.left - s / 2 + "px", top: e.clientY - r.top - s / 2 + "px" });
        btn.appendChild(rip);
        setTimeout(() => rip.remove(), 700);
      }
    };
    window.addEventListener("pointerdown", onDown, { passive: true });

    let raf = 0, cursor, magnet = null;
    const pos = { x: -100, y: -100 }, ring = { x: -100, y: -100 };
    const onMove = (e) => {
      pos.x = e.clientX; pos.y = e.clientY;
      const hot = e.target.closest?.("a,button,select,[role=button]");
      cursor.classList.toggle("hot", !!hot);
      const m = e.target.closest?.(".button");
      if (magnet && magnet !== m) { magnet.style.translate = ""; magnet = null; }
      if (m) {
        const r = m.getBoundingClientRect();
        m.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.18}px ${(e.clientY - r.top - r.height / 2) * 0.28}px`;
        magnet = m;
      }
    };
    const onLeave = () => { cursor.classList.add("gone"); };
    const onEnter = () => { cursor.classList.remove("gone"); };
    if (fine) {
      cursor = document.createElement("div");
      cursor.className = "fx-cursor gone";
      layer.appendChild(cursor);
      const loop = () => {
        ring.x += (pos.x - ring.x) * 0.2; ring.y += (pos.y - ring.y) * 0.2;
        cursor.style.transform = `translate3d(${ring.x}px,${ring.y}px,0)`;
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("mouseleave", onLeave);
      document.addEventListener("mouseenter", onEnter);
      window.addEventListener("pointermove", onEnter, { once: true });
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      layer.remove();
    };
  }, []);
  return null;
}
