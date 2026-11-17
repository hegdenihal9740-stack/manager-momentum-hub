// @ts-nocheck
import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox, Sparkles, Line } from "@react-three/drei";

const cols = ["#2EC4F1", "#3B4FA8", "#7A3A93", "#E5237B", "#EE3333", "#4F8BD6", "#C26BE0", "#FF4F9A"];

/** Eight module blocks fly in from far away and lock into an orbit around the company core. */
function Assembly() {
  const group = useRef(), blocks = useRef([]), core = useRef();
  const radius = useRef(6);
  useFrame((state, delta) => {
    radius.current += (1.75 - radius.current) * Math.min(1, delta * 1.6);
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y += delta * 0.28;
      group.current.rotation.x += ((state.pointer.y * 0.35) - group.current.rotation.x) * 0.06;
      group.current.rotation.z += ((-state.pointer.x * 0.25) - group.current.rotation.z) * 0.06;
    }
    blocks.current.forEach((b, i) => {
      if (!b) return;
      const a = (i / cols.length) * Math.PI * 2;
      b.position.set(Math.cos(a) * radius.current, Math.sin(t * 1.2 + i) * 0.22, Math.sin(a) * radius.current);
      b.rotation.x = t * 0.6 + i; b.rotation.y = t * 0.8 + i;
    });
    if (core.current) { core.current.rotation.x = t * 0.4; core.current.rotation.y = t * 0.55; }
  });
  return (
    <group ref={group}>
      <Float speed={1.4} floatIntensity={0.35}>
        <mesh ref={core}>
          <torusKnotGeometry args={[0.52, 0.17, 160, 24]} />
          <meshPhysicalMaterial color="#7A3A93" emissive="#E5237B" emissiveIntensity={0.45} roughness={0.15} metalness={0.5} clearcoat={1} />
        </mesh>
        <mesh scale={1.25}>
          <icosahedronGeometry args={[0.9, 1]} />
          <meshBasicMaterial color="#2EC4F1" wireframe transparent opacity={0.18} />
        </mesh>
      </Float>
      {cols.map((c, i) => {
        const a = (i / cols.length) * Math.PI * 2;
        return <Line key={"l" + i} points={[[0, 0, 0], [Math.cos(a) * 1.75, 0, Math.sin(a) * 1.75]]} color={c} lineWidth={1} transparent opacity={0.35} />;
      })}
      {cols.map((c, i) => (
        <RoundedBox key={i} ref={(el) => (blocks.current[i] = el)} args={[0.34, 0.34, 0.34]} radius={0.08} smoothness={3}>
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.55} roughness={0.25} metalness={0.45} />
        </RoundedBox>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.75, 0.008, 8, 120]} />
        <meshBasicMaterial color="#C26BE0" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

export default function AboutScene({ paused = false }) {
  return (
    <Canvas resize={{ offsetSize: true }} camera={{ position: [0, 1.3, 5.4], fov: 42 }} dpr={[1, 1.25]} frameloop={paused ? "never" : "always"}>
      <ambientLight intensity={0.5} />
      <pointLight position={[3, 3, 4]} intensity={30} color="#2EC4F1" />
      <pointLight position={[-3, -1, 3]} intensity={26} color="#E5237B" />
      <pointLight position={[0, -3, -2]} intensity={14} color="#7A3A93" />
      <Sparkles count={60} scale={[6, 4, 4]} size={2.4} speed={0.35} color="#FF8DC4" />
      <Assembly />
    </Canvas>
  );
}
