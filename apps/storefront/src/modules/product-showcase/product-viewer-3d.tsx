"use client"

import React, { Suspense, useRef, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, ContactShadows, useGLTF, PerspectiveCamera } from "@react-three/drei"
import * as THREE from "three"

interface ProductViewer3DProps {
  colorHex?: string
  modelType?: "tshirt" | "hoodie" | "canta"
}

function TshirtModel({ colorHex = "#202020" }: { colorHex: string }) {
  const { nodes, materials } = useGLTF("/models/tshirt.glb") as any
  const groupRef = useRef<THREE.Group>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  const targetColor = useRef(new THREE.Color(colorHex))

  useEffect(() => {
    targetColor.current.set(colorHex)
  }, [colorHex])

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.color.lerp(targetColor.current, delta * 4)
    }
    // Otomatik çok hafif beşik salınımı
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.25
    }
  })

  return (
    <group ref={groupRef} scale={8.5} position={[0, -1.4, 0]}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.tshirt.geometry}
        dispose={null}
      >
        <meshStandardMaterial
          ref={materialRef}
          color={colorHex}
          roughness={0.65}
          metalness={0.05}
        />
      </mesh>
    </group>
  )
}

export default function ProductViewer3D({
  colorHex = "#202020",
}: ProductViewer3DProps) {
  return (
    <div className="relative w-full h-[450px] small:h-[550px] rounded-2xl bg-gradient-to-b from-[#1A1C1F] to-[#121315] border border-[#26282B] shadow-2xl overflow-hidden">
      {/* 360 İpucu Rozeti */}
      <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-[#141517]/80 border border-[#2D3035] text-[11px] font-medium text-[#D4AF37] backdrop-blur-md flex items-center gap-1.5">
        <span>🔄 360° Çevirip İnceleyin</span>
      </div>

      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        className="cursor-grab active:cursor-grabbing"
      >
        <PerspectiveCamera makeDefault position={[0, 0, 7]} fov={35} />

        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
        <directionalLight position={[-5, 4, -3]} intensity={0.8} color="#D4AF37" />

        <Environment preset="city" />

        <Suspense fallback={null}>
          <TshirtModel colorHex={colorHex} />
        </Suspense>

        <ContactShadows
          position={[0, -2.4, 0]}
          opacity={0.4}
          scale={10}
          blur={2.5}
          far={4}
        />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>
    </div>
  )
}
