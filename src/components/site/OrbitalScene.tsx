// @ts-nocheck
import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Stars, Torus, RoundedBox, Sparkles } from '@react-three/drei'

function Core({ ready = true }) {
  const ref = useRef()
  const grow = useRef(0.15)

  useFrame((state, delta) => {
    if (!ref.current) return
    grow.current += ((ready ? 1 : 0.15) - grow.current) * Math.min(1, delta * 2.2)
    ref.current.scale.setScalar(grow.current)
    ref.current.rotation.y += delta * 0.1 + (1 - grow.current) * delta * 6
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.22) * 0.08 + state.pointer.y * 0.25
    ref.current.rotation.z = -state.pointer.x * 0.2
  })

  return <group ref={ref}>
    <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.28}>
      <mesh>
        <dodecahedronGeometry args={[0.88, 1]}/>
        <meshPhysicalMaterial color="#2787aa" emissive="#074257" emissiveIntensity={1.1} roughness={0.2} metalness={0.42} clearcoat={1} clearcoatRoughness={0.12}/>
      </mesh>
      <mesh scale={1.035}>
        <dodecahedronGeometry args={[0.88, 1]}/>
        <meshBasicMaterial color="#a5e7ff" wireframe transparent opacity={0.16}/>
      </mesh>
      <mesh>
        <SphereCore/>
      </mesh>
      <Torus args={[1.23, 0.018, 10, 96]} rotation={[1.12, 0.12, 0.3]}>
        <meshBasicMaterial color="#2EC4F1" transparent opacity={0.85}/>
      </Torus>
      <Torus args={[1.44, 0.012, 8, 96]} rotation={[0.34, 1.05, 0.5]}>
        <meshBasicMaterial color="#C26BE0" transparent opacity={0.75}/>
      </Torus>
      <Torus args={[1.62, 0.008, 8, 96]} rotation={[1.3, 0.62, 0.05]}>
        <meshBasicMaterial color="#FF4F9A" transparent opacity={0.6}/>
      </Torus>
      <Satellites/>
      <SphereDot position={[1.25, 0.18, 0.24]} color="#dcf6ff" size={0.055}/>
      <SphereDot position={[-0.9, 0.97, -0.15]} color="#9cacff" size={0.045}/>
    </Float>
  </group>
}

const satColors = ['#2EC4F1', '#3B4FA8', '#7A3A93', '#E5237B', '#EE3333', '#4F8BD6', '#C26BE0', '#FF4F9A']
function Satellites() {
  const ref = useRef()
  useFrame((state, delta) => { if (ref.current) ref.current.rotation.y -= delta * 0.4 })
  return <group ref={ref} rotation={[0.42, 0, 0.18]}>
    {satColors.map((c, i) => {
      const a = (i / satColors.length) * Math.PI * 2
      return <RoundedBox key={i} args={[0.13, 0.13, 0.13]} radius={0.03} position={[Math.cos(a) * 1.95, Math.sin(i * 1.7) * 0.18, Math.sin(a) * 1.95]} rotation={[i, i * 0.5, 0]}>
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.7} roughness={0.3} metalness={0.4}/>
      </RoundedBox>
    })}
  </group>
}

function SphereCore() {
  return <>
    <sphereGeometry args={[0.33, 24, 24]}/>
    <meshPhysicalMaterial color="#a5e7ff" emissive="#41a6cb" emissiveIntensity={1.35} roughness={0.1} metalness={0.28} clearcoat={1}/>
  </>
}

function SphereDot({ position, color, size }) {
  return <mesh position={position}>
    <sphereGeometry args={[size, 12, 12]}/>
    <meshBasicMaterial color={color}/>
  </mesh>
}

function Scene({ ready }) {
  return <>
    <ambientLight intensity={0.45}/>
    <pointLight position={[3, 3, 4]} intensity={32} color="#69ccf0"/>
    <pointLight position={[-3, -2, 2]} intensity={24} color="#C26BE0"/>
    <pointLight position={[0, -3, -2]} intensity={14} color="#E5237B"/>
    <Stars radius={36} depth={22} count={220} factor={1.5} saturation={0.25} fade speed={0.3}/>
    <Sparkles count={45} scale={[5, 4, 3]} size={2} speed={0.4} color="#FF8DC4"/>
    <Core ready={ready}/>
  </>
}

export default function OrbitalScene({ paused = false, ready = true }) {
  return <Canvas resize={{ offsetSize: true }} camera={{ position: [0, 0, 5.8], fov: 42 }} dpr={[1, 1.25]} frameloop={paused ? "never" : "always"}>
    <Scene ready={ready}/>
  </Canvas>
}
