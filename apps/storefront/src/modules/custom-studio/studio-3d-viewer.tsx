"use client"

import React, { Suspense, useRef, useEffect, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, ContactShadows, useGLTF, Decal, useTexture } from "@react-three/drei"
import * as THREE from "three"

interface Studio3DViewerProps {
  colorHex: string
  logoSrc: string | null
  activeView: "front" | "back"
  scale: number
  positionX: number // 185 - 415 (Stage 600px bazlı)
  positionY: number // 145 - 555 (Stage 680px bazlı)
}

function Tshirt3DModel({
  colorHex,
  logoSrc,
  activeView,
  scale,
  positionX,
  positionY,
}: Studio3DViewerProps) {
  const { nodes, materials } = useGLTF("/models/tshirt.glb") as any
  const meshRef = useRef<THREE.Mesh>(null)

  const tshirtMaterial = React.useMemo(() => {
    const mat = (materials.color as THREE.MeshStandardMaterial).clone()
    mat.color = new THREE.Color(colorHex)
    mat.roughness = 0.65
    mat.metalness = 0.05
    return mat
  }, [materials, colorHex])

  // 600x680 piksel sahne koordinatlarını 3D Decal koordinatlarına dönüştür
  // X: 300 merkez -> 0, 245 sol göğüs -> -0.075
  const decalX = ((positionX - 300) / 300) * 0.18
  // Y: 330 orta -> 0.05
  const decalY = -((positionY - 330) / 340) * 0.22 + 0.05
  const decalZ = activeView === "front" ? 0.13 : -0.13
  const decalScale = 0.12 * scale
  const decalRotation: [number, number, number] =
    activeView === "front" ? [0, 0, 0] : [0, Math.PI, 0]

  // Yumuşak kamera ve model dönüşü
  useFrame((_, delta) => {
    if (meshRef.current) {
      const targetRotY = activeView === "front" ? 0 : Math.PI
      meshRef.current.rotation.y = THREE.MathUtils.damp(
        meshRef.current.rotation.y,
        targetRotY,
        5,
        delta
      )
    }
  })

  return (
    <group scale={8.5} position={[0, -1.3, 0]}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        geometry={nodes.tshirt.geometry}
        material={tshirtMaterial}
        dispose={null}
      >
        {logoSrc && (
          <DecalWithTexture
            position={[decalX, decalY, decalZ]}
            rotation={decalRotation}
            scale={decalScale}
            url={logoSrc}
          />
        )}
      </mesh>
    </group>
  )
}

function DecalWithTexture({
  position,
  rotation,
  scale,
  url,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  url: string
}) {
  const texture = useTexture(url)
  texture.colorSpace = THREE.SRGBColorSpace

  return (
    <Decal
      position={position}
      rotation={rotation}
      scale={scale}
      map={texture}
      depthTest={true}
    />
  )
}

export default function Studio3DViewer(props: Studio3DViewerProps) {
  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-gradient-to-b from-[#18191C] to-[#111214] border border-[#26282B]">
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
          <Tshirt3DModel {...props} />
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
