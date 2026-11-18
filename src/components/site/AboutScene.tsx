// @ts-nocheck
import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles, Trail, Environment, Lightformer } from "@react-three/drei";

/**
 * "Ribbon M" — the DevOps Manager logo built from its four rounded strokes.
 * The strokes fly in and snap together each time the section scrolls into view,
 * a spark of light runs along the M, and every few seconds the strokes breathe
 * apart and lock back with a shock-ring. Eight module orbs circle on a tilted ring.
 */

// Stroke centre-lines measured from the logo mark (x, y), with the logo's own colours.
const STROKES = [
  { from: [-0.82, -0.7], to: [-0.82, 0.62], c0: "#2A3A82", c1: "#4F8BD6", z: -0.06 }, // left leg
  { from: [0, -0.12], to: [-0.82, 0.62], c0: "#3B4FA8", c1: "#2EC4F1", z: 0.06 },     // left diagonal
  { from: [0, -0.12], to: [0.82, 0.62], c0: "#7A3A93", c1: "#E5237B", z: 0.03 },      // right diagonal
  { from: [0.82, -0.7], to: [0.82, 0.62], c0: "#EE3333", c1: "#E5237B", z: -0.06 },   // right leg
];
const RADIUS = 0.21;
const RUN_PATH = [[-0.82, -0.7], [-0.82, 0.62], [0, -0.12], [0.82, 0.62], [0.82, -0.7]];
const ORBS = ["#2EC4F1", "#3B4FA8", "#7A3A93", "#E5237B", "#EE3333", "#4F8BD6", "#C26BE0", "#FF4F9A"];

const easeOutBack = (x) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const clamp01 = (x) => Math.min(1, Math.max(0, x));

function useStrokeGeometry(s) {
  return useMemo(() => {
    const dx = s.to[0] - s.from[0], dy = s.to[1] - s.from[1];
    const len = Math.hypot(dx, dy);
    const g = new THREE.CapsuleGeometry(RADIUS, len, 10, 28);
    const total = len + RADIUS * 2;
    const a = new THREE.Color(s.c0), b = new THREE.Color(s.c1), tmp = new THREE.Color();
    const pos = g.attributes.position, cols = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const t = clamp01((pos.getY(i) + total / 2) / total);
      tmp.copy(a).lerp(b, t);
      cols.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    return {
      geometry: g,
      center: new THREE.Vector3((s.from[0] + s.to[0]) / 2, (s.from[1] + s.to[1]) / 2, s.z),
      angle: -Math.atan2(dx, dy),
    };
  }, [s]);
}

function Stroke({ s, i, clock }) {
  const ref = useRef();
  const { geometry, center, angle } = useStrokeGeometry(s);
  // Where each stroke starts before it flies in (scattered, spun).
  const start = useMemo(() => new THREE.Vector3((i % 2 ? 1 : -1) * (2.6 + i * 0.3), (i < 2 ? 1 : -1) * 2.2, -3 + i * 0.6), [i]);
  const outward = useMemo(() => new THREE.Vector3(center.x, center.y + 0.05, 0).normalize(), [center]);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const m = ref.current; if (!m) return;
    const t = clock.current;
    const p = clamp01((t - 0.15 - i * 0.18) / 1.25);
    const e = easeOutBack(p);
    tmp.copy(start).lerp(center, e);
    // breathing "exploded view" pulse after assembly
    const cyc = t > 2.6 ? (t - 2.6) % 7 : 99;
    const breath = cyc < 1.4 ? Math.sin((cyc / 1.4) * Math.PI) : 0;
    tmp.addScaledVector(outward, breath * 0.28);
    tmp.z += breath * (i % 2 ? 0.25 : -0.25);
    m.position.copy(tmp);
    m.rotation.z = angle + (1 - e) * (i % 2 ? 3.2 : -3.2) + breath * (i % 2 ? 0.12 : -0.12);
    m.rotation.x = (1 - e) * 2.4 + breath * 0.5;
    m.scale.set(1, 1, 0.62);
  });

  return (
    <mesh ref={ref} geometry={geometry}>
      <meshPhysicalMaterial vertexColors roughness={0.22} metalness={0.25} clearcoat={1} clearcoatRoughness={0.08} iridescence={0.35} sheen={0.4} sheenColor="#ffffff" />
    </mesh>
  );
}

function Runner({ clock }) {
  const ref = useRef();
  const segs = useMemo(() => {
    const pts = RUN_PATH.map(([x, y]) => new THREE.Vector3(x, y, 0.24));
    const lens = pts.slice(1).map((p, k) => p.distanceTo(pts[k]));
    return { pts, lens, total: lens.reduce((a, b) => a + b, 0) };
  }, []);
  const dist = useRef(0), dir = useRef(1);
  useFrame((_, delta) => {
    if (!ref.current) return;
    const visible = clock.current > 1.6;
    ref.current.visible = visible;
    if (!visible) { ref.current.position.copy(segs.pts[0]); return; }
    dist.current += Math.min(delta, 0.05) * 1.5 * dir.current;
    if (dist.current > segs.total) { dist.current = segs.total; dir.current = -1; }
    if (dist.current < 0) { dist.current = 0; dir.current = 1; }
    let d = dist.current, k = 0;
    while (k < segs.lens.length - 1 && d > segs.lens[k]) { d -= segs.lens[k]; k++; }
    ref.current.position.lerpVectors(segs.pts[k], segs.pts[k + 1], clamp01(d / segs.lens[k]));
  });
  return (
    <Trail width={1.1} length={5} color="#BFF2FF" attenuation={(w) => w * w} decay={1.5}>
      <mesh ref={ref} position={[-0.82, -0.7, 0.24]}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </Trail>
  );
}

function ShockRing({ clock }) {
  const ref = useRef(), mat = useRef();
  useFrame(() => {
    const t = clock.current;
    // fires once when the M locks together, then with every breath
    const fire = t < 2.6 ? t - 1.4 : ((t - 2.6) % 7) - 1.3;
    const k = fire >= 0 && fire < 1.2 ? fire / 1.2 : -1;
    if (!ref.current) return;
    ref.current.visible = k >= 0;
    if (k >= 0) { ref.current.scale.setScalar(0.8 + k * 2.4); mat.current.opacity = (1 - k) * 0.7; }
  });
  return (
    <mesh ref={ref} position={[0, 0, -0.2]}>
      <ringGeometry args={[0.98, 1, 96]} />
      <meshBasicMaterial ref={mat} color="#9FE6FF" transparent opacity={0} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function ModuleOrbit({ clock }) {
  const group = useRef(), orbs = useRef([]);
  useFrame((state, delta) => {
    const grow = easeOutBack(clamp01((clock.current - 0.9) / 1.4));
    if (group.current) { group.current.rotation.y += Math.min(delta, 0.05) * 0.35; group.current.scale.setScalar(Math.max(0.001, grow)); }
    const t = state.clock.elapsedTime;
    orbs.current.forEach((o, i) => { if (o) o.scale.setScalar(1 + Math.sin(t * 2.4 + i) * 0.18); });
  });
  return (
    <group rotation={[1.18, 0, 0.16]} position={[0, -0.05, 0]}>
      <group ref={group}>
        <mesh>
          <torusGeometry args={[1.75, 0.006, 8, 160]} />
          <meshBasicMaterial color="#C26BE0" transparent opacity={0.6} toneMapped={false} />
        </mesh>
        <mesh>
          <torusGeometry args={[1.95, 0.003, 8, 160]} />
          <meshBasicMaterial color="#2EC4F1" transparent opacity={0.35} toneMapped={false} />
        </mesh>
        {ORBS.map((c, i) => {
          const a = (i / ORBS.length) * Math.PI * 2;
          return (
            <mesh key={i} ref={(el) => (orbs.current[i] = el)} position={[Math.cos(a) * 1.75, Math.sin(a) * 1.75, 0]}>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.6} toneMapped={false} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function Halo() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d"), grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, "rgba(122,58,147,0.55)"); grd.addColorStop(0.45, "rgba(59,79,168,0.22)"); grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);
  return (
    <mesh position={[0, 0, -1.2]}>
      <planeGeometry args={[5.5, 5.5]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function LogoM({ paused }) {
  const clock = useRef(0), group = useRef();
  // Replay the assembly every time the section comes back into view.
  useEffect(() => { if (!paused) clock.current = 0; }, [paused]);
  useFrame((state, delta) => {
    clock.current += Math.min(delta, 0.05);
    const g = group.current; if (!g) return;
    const t = state.clock.elapsedTime;
    g.rotation.y += ((state.pointer.x * 0.35 + Math.sin(t * 0.45) * 0.28) - g.rotation.y) * 0.05;
    g.rotation.x += ((-state.pointer.y * 0.18 + Math.sin(t * 0.3) * 0.06) - g.rotation.x) * 0.05;
    g.position.y = Math.sin(t * 0.9) * 0.06;
  });
  return (
    <group ref={group}>
      {STROKES.map((s, i) => <Stroke key={i} s={s} i={i} clock={clock} />)}
      <Runner clock={clock} />
      <ShockRing clock={clock} />
      <ModuleOrbit clock={clock} />
    </group>
  );
}

export default function AboutScene({ paused = false }) {
  return (
    <Canvas camera={{ position: [0, 0.15, 5.2], fov: 40 }} dpr={[1, 1.4]} frameloop={paused ? "never" : "always"} gl={{ antialias: true }}>
      <ambientLight intensity={0.55} />
      <directionalLight position={[2, 3, 4]} intensity={1.6} />
      <pointLight position={[-3, 1, 3]} intensity={18} color="#2EC4F1" />
      <pointLight position={[3, -1, 3]} intensity={18} color="#E5237B" />
      <Environment resolution={64}>
        <Lightformer intensity={2.2} position={[0, 4, 2]} scale={[8, 3, 1]} />
        <Lightformer intensity={1.4} color="#2EC4F1" position={[-4, 0, 2]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer intensity={1.4} color="#E5237B" position={[4, 0, 2]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
      </Environment>
      <Halo />
      <Sparkles count={50} scale={[6, 4, 3]} size={2.2} speed={0.35} color="#FF8DC4" />
      <LogoM paused={paused} />
    </Canvas>
  );
}
