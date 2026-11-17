// @ts-nocheck
import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, Lightformer, Trail, Sparkles, RoundedBox } from "@react-three/drei";

// Brand gradient (left → right), same order as the DevOps Manager logo.
const STOPS = ["#2EC4F1", "#3B4FA8", "#7A3A93", "#E5237B", "#EE3333"];
const TILES = ["#2EC4F1", "#3B4FA8", "#7A3A93", "#E5237B", "#EE3333", "#4F8BD6", "#C26BE0", "#FF4F9A"];

/** The brand "M" as a solid, bevelled 3D mark with the logo's cyan → red gradient baked into its vertices. */
function useMarkGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    const p = [[-1, -1], [-1, 1], [-0.6, 1], [0, 0.2], [0.6, 1], [1, 1], [1, -1], [0.6, -1], [0.6, 0.38], [0, -0.44], [-0.6, 0.38], [-0.6, -1]];
    s.moveTo(p[0][0], p[0][1]);
    p.slice(1).forEach(([x, y]) => s.lineTo(x, y));
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.42, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.07, bevelSegments: 5, curveSegments: 6 });
    g.center();
    g.computeBoundingBox();
    const { min, max } = g.boundingBox;
    const pos = g.attributes.position, cols = new Float32Array(pos.count * 3);
    const a = new THREE.Color(), b = new THREE.Color(), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const tx = (pos.getX(i) - min.x) / (max.x - min.x), ty = (pos.getY(i) - min.y) / (max.y - min.y);
      const t = Math.min(1, Math.max(0, tx * 0.85 + (1 - ty) * 0.15));
      const seg = t * (STOPS.length - 1), k = Math.min(STOPS.length - 2, Math.floor(seg));
      a.set(STOPS[k]); b.set(STOPS[k + 1]); c.copy(a).lerp(b, seg - k);
      cols.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    g.computeVertexNormals();
    return g;
  }, []);
}

function Mark() {
  const geo = useMarkGeometry();
  const ref = useRef(), grow = useRef(0);
  useFrame((state, delta) => {
    const d = Math.min(delta, 0.05), t = state.clock.elapsedTime;
    grow.current += (1 - grow.current) * d * 2.2;
    const g = ref.current; if (!g) return;
    g.scale.setScalar(0.001 + grow.current);
    const spin = (1 - grow.current) * Math.PI * 2;
    g.rotation.y += ((state.pointer.x * 0.35 + Math.sin(t * 0.6) * 0.22 + spin) - g.rotation.y) * d * 4;
    g.rotation.x += ((-state.pointer.y * 0.3 + Math.sin(t * 0.8) * 0.06) - g.rotation.x) * d * 4;
  });
  return (
    <group ref={ref}>
      <Float speed={1.6} rotationIntensity={0.15} floatIntensity={0.5}>
        <mesh geometry={geo}>
          <meshPhysicalMaterial vertexColors roughness={0.18} metalness={0.35} clearcoat={1} clearcoatRoughness={0.08} iridescence={0.4} iridescenceIOR={1.4} emissive="#3b1d55" emissiveIntensity={0.25} />
        </mesh>
      </Float>
    </group>
  );
}

/** Glowing comets with light trails on three tilted orbits around the mark. */
function Comet({ radius, speed, tilt, color, offset }) {
  const ref = useRef(), angle = useRef(offset);
  // advance by clamped frame time so the trail never streaks after the scene was paused off-screen
  useFrame((state, delta) => {
    angle.current += Math.min(delta, 0.05) * speed;
    ref.current?.position.set(Math.cos(angle.current) * radius, 0, Math.sin(angle.current) * radius);
  });
  return (
    <group rotation={tilt}>
      <mesh rotation-x={Math.PI / 2}>
        <torusGeometry args={[radius, 0.006, 6, 160]} />
        <meshBasicMaterial color={color} transparent opacity={0.28} toneMapped={false} />
      </mesh>
      <Trail width={1.4} length={5} color={color} attenuation={(w) => w * w}>
        <mesh ref={ref} position={[Math.cos(offset) * radius, 0, Math.sin(offset) * radius]}>
          <sphereGeometry args={[0.075, 16, 16]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      </Trail>
    </group>
  );
}

/** Eight module tiles circling behind the mark like a halo (always behind it, never covering it). */
function Tiles() {
  const ref = useRef();
  useFrame((state, delta) => {
    const g = ref.current; if (!g) return;
    g.rotation.z -= Math.min(delta, 0.05) * 0.22;
    g.children.forEach((m, i) => { m.rotation.z = -g.rotation.z; m.rotation.y = Math.sin(state.clock.elapsedTime * 1.2 + i) * 0.5; });
  });
  return (
    <group ref={ref} position={[0, 0, -1.3]}>
      {TILES.map((c, i) => {
        const a = (i / TILES.length) * Math.PI * 2;
        return (
          <RoundedBox key={i} args={[0.34, 0.34, 0.07]} radius={0.06} smoothness={3} position={[Math.cos(a) * 2.05, Math.sin(a) * 2.05, 0]}>
            <meshPhysicalMaterial color={c} emissive={c} emissiveIntensity={0.4} roughness={0.12} metalness={0.2} clearcoat={1} />
          </RoundedBox>
        );
      })}
    </group>
  );
}

/** Soft glowing disc behind the mark. */
function Halo() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const x = c.getContext("2d"), g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(229,35,123,0.55)"); g.addColorStop(0.45, "rgba(122,58,147,0.28)"); g.addColorStop(1, "rgba(46,196,241,0)");
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  return <mesh position={[0, 0, -1.6]}><planeGeometry args={[5.2, 5.2]} /><meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} /></mesh>;
}

export default function AboutScene({ paused = false }) {
  return (
    <Canvas resize={{ offsetSize: true }} camera={{ position: [0, 0, 6.6], fov: 40 }} dpr={[1, 1.5]} frameloop={paused ? "never" : "always"} gl={{ antialias: true }}>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} />
      <pointLight position={[-3, 1, 3]} intensity={18} color="#2EC4F1" />
      <pointLight position={[3, -1, 3]} intensity={18} color="#E5237B" />
      <Environment resolution={128}>
        <Lightformer intensity={2.2} position={[0, 4, 3]} scale={[8, 2, 1]} />
        <Lightformer intensity={1.6} color="#2EC4F1" position={[-5, 0, 1]} rotation-y={Math.PI / 2} scale={[10, 2, 1]} />
        <Lightformer intensity={1.6} color="#E5237B" position={[5, 0, 1]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
      </Environment>
      <Sparkles count={70} scale={[7, 5, 4]} size={2.2} speed={0.35} color="#FF9BCB" />
      <Mark />
      <Tiles />
      <Comet radius={1.55} speed={0.9} tilt={[0.35, 0, 0.5]} color="#2EC4F1" offset={0} />
      <Comet radius={1.8} speed={-0.7} tilt={[-0.4, 0, -0.35]} color="#E5237B" offset={2} />
      <Comet radius={1.95} speed={0.55} tilt={[1.2, 0.3, 0]} color="#C26BE0" offset={4} />
      <Halo />
    </Canvas>
  );
}
