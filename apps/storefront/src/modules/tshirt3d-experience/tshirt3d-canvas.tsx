"use client"

/**
 * Adapted from https://github.com/accodes21/tshirt3d (MIT License — Copyright (c) 2023 Aarya Chopkar)
 * Performance-optimized for Nizamlar Baskı:
 * - Zero React setState inside useFrame (direct Three.js ref mutations only)
 * - Pauses frameloop when scrolled out of viewport
 * - Dedicated canvasRef for accurate PNG export
 */

import React, { Suspense, useEffect, useMemo, useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Center, Decal, useGLTF, useTexture } from "@react-three/drei"
import * as THREE from "three"

const MODEL_PATH = "/tshirt3d/shirt_baked.glb"

function createBackdropShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext("2d")!
  const grad = ctx.createRadialGradient(128, 128, 18, 128, 128, 124)
  grad.addColorStop(0, "rgba(22, 23, 24, 0.42)")
  grad.addColorStop(0.45, "rgba(34, 35, 37, 0.22)")
  grad.addColorStop(0.78, "rgba(49, 37, 30, 0.07)")
  grad.addColorStop(1, "rgba(243, 239, 231, 0)")
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 256, 256)
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

function BackdropHalo() {
  const shadowTexture = useMemo(() => createBackdropShadowTexture(), [])
  useEffect(() => () => shadowTexture.dispose(), [shadowTexture])

  return (
    <mesh position={[0, -0.02, -0.16]} renderOrder={-1}>
      <planeGeometry args={[0.92, 1.05]} />
      <meshBasicMaterial
        map={shadowTexture}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

function CameraRig({
  intro,
  zoom,
  children,
}: {
  intro: boolean
  zoom: number
  children: React.ReactNode
}) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    const width = state.size.width
    const isBreakpoint = width <= 1100
    const isMobile = width <= 640

    let targetX = -0.36
    let targetY = 0
    let targetZ = 2 / zoom

    if (intro) {
      if (isBreakpoint) {
        targetX = -0.22
        targetY = 0
        targetZ = 2.05 / zoom
      }
      if (isMobile) {
        targetX = 0
        targetY = 0.22
        targetZ = 2.45 / zoom
      }
    } else {
      if (isMobile) {
        targetX = 0
        targetY = 0.05
        targetZ = 2.45 / zoom
      } else {
        targetX = 0
        targetY = 0
        targetZ = 2 / zoom
      }
    }

    state.camera.position.x = THREE.MathUtils.damp(
      state.camera.position.x,
      targetX,
      4.5,
      dt,
    )
    state.camera.position.y = THREE.MathUtils.damp(
      state.camera.position.y,
      targetY,
      4.5,
      dt,
    )
    state.camera.position.z = THREE.MathUtils.damp(
      state.camera.position.z,
      targetZ,
      4.5,
      dt,
    )

    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.damp(
        groupRef.current.rotation.x,
        state.pointer.y / 10,
        4.5,
        dt,
      )
      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        -state.pointer.x / 5,
        4.5,
        dt,
      )
    }
  })

  return <group ref={groupRef}>{children}</group>
}

function ShirtMesh({
  color,
  isLogoTexture,
  isFullTexture,
  logoDecal,
  fullDecal,
  autoRotate,
  rotationYOffsetRef,
}: {
  color: string
  isLogoTexture: boolean
  isFullTexture: boolean
  logoDecal: string
  fullDecal: string
  autoRotate: boolean
  rotationYOffsetRef: React.MutableRefObject<number>
}) {
  const gltf = useGLTF(MODEL_PATH) as unknown as {
    nodes: { T_Shirt_male: THREE.Mesh }
    materials: { lambert1: THREE.MeshStandardMaterial }
  }

  const rawLogoTex = useTexture(logoDecal)
  const rawFullTex = useTexture(fullDecal)
  const gl = useThree((s) => s.gl)

  const logoTexture = useMemo(() => {
    const t = rawLogoTex.clone()
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy())
    t.needsUpdate = true
    return t
  }, [rawLogoTex, gl])

  const fullTexture = useMemo(() => {
    const t = rawFullTex.clone()
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
    t.needsUpdate = true
    return t
  }, [rawFullTex, gl])

  useEffect(() => () => logoTexture.dispose(), [logoTexture])
  useEffect(() => () => fullTexture.dispose(), [fullTexture])

  const shirtMaterial = useMemo(() => {
    const mat = gltf.materials.lambert1.clone()
    mat.roughness = 0.88
    mat.metalness = 0.02
    mat.color.set(color)
    return mat
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gltf.materials.lambert1])

  useEffect(() => () => shirtMaterial.dispose(), [shirtMaterial])

  const targetColor = useMemo(() => new THREE.Color(color), [color])
  const meshRef = useRef<THREE.Mesh>(null)
  const dragRef = useRef<{ active: boolean; lastX: number; lastY: number }>({
    active: false,
    lastX: 0,
    lastY: 0,
  })
  const rotXRef = useRef(0)

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    const step = 1 - Math.exp(-6 * dt)
    shirtMaterial.color.lerp(targetColor, step)

    if (meshRef.current) {
      const sway =
        autoRotate && !dragRef.current.active
          ? Math.sin(state.clock.elapsedTime * 0.7) * 0.22 - 0.12
          : 0
      const targetY = rotationYOffsetRef.current + sway
      meshRef.current.rotation.y = THREE.MathUtils.damp(
        meshRef.current.rotation.y,
        targetY,
        8,
        dt,
      )
      meshRef.current.rotation.x = THREE.MathUtils.damp(
        meshRef.current.rotation.x,
        rotXRef.current,
        8,
        dt,
      )
    }
  })

  return (
    <group>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        geometry={gltf.nodes.T_Shirt_male.geometry}
        material={shirtMaterial}
        dispose={null}
        onPointerDown={(e) => {
          e.stopPropagation()
          dragRef.current = {
            active: true,
            lastX: e.clientX,
            lastY: e.clientY,
          }
        }}
        onPointerUp={() => {
          dragRef.current.active = false
        }}
        onPointerLeave={() => {
          dragRef.current.active = false
        }}
        onPointerMove={(e) => {
          if (!dragRef.current.active) return
          const dx = e.clientX - dragRef.current.lastX
          const dy = e.clientY - dragRef.current.lastY
          rotationYOffsetRef.current += dx * 0.012
          rotXRef.current = THREE.MathUtils.clamp(
            rotXRef.current + dy * 0.006,
            -0.35,
            0.35,
          )
          dragRef.current.lastX = e.clientX
          dragRef.current.lastY = e.clientY
        }}
      >
        {isFullTexture && (
          <Decal
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            scale={1}
            map={fullTexture}
          />
        )}

        {isLogoTexture && (
          <Decal
            position={[0, 0.04, 0.15]}
            rotation={[0, 0, 0]}
            scale={0.15}
            map={logoTexture}
            depthTest={false}
          />
        )}
      </mesh>
    </group>
  )
}

export default function Tshirt3dCanvas({
  intro,
  color,
  isLogoTexture,
  isFullTexture,
  logoDecal,
  fullDecal,
  autoRotate,
  zoom,
  rotationYOffsetRef,
  isVisible,
  onCanvasReady,
}: {
  intro: boolean
  color: string
  isLogoTexture: boolean
  isFullTexture: boolean
  logoDecal: string
  fullDecal: string
  autoRotate: boolean
  zoom: number
  rotationYOffsetRef: React.MutableRefObject<number>
  isVisible: boolean
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void
}) {
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 768px)").matches

  return (
    <Canvas
      camera={{ position: [0, 0, 0], fov: 25 }}
      dpr={isMobile ? [1, 1.25] : [1, 1.5]}
      frameloop={isVisible ? "always" : "never"}
      gl={{
        preserveDrawingBuffer: true,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        onCanvasReady?.(gl.domElement)
      }}
      className="w-full max-w-full h-full transition-all ease-in cursor-grab active:cursor-grabbing"
    >
      <ambientLight intensity={0.78} color="#FFFDF9" />
      <directionalLight position={[3.5, 5, 5]} intensity={1.65} color="#FFFBF2" />
      <directionalLight position={[-4, 3, 4]} intensity={0.75} color="#EFE5D4" />
      <directionalLight position={[0, -3, 2]} intensity={0.35} color="#D8C3A5" />

      <Suspense fallback={null}>
        <CameraRig intro={intro} zoom={zoom}>
          <BackdropHalo />
          <Center>
            <ShirtMesh
              color={color}
              isLogoTexture={isLogoTexture}
              isFullTexture={isFullTexture}
              logoDecal={logoDecal}
              fullDecal={fullDecal}
              autoRotate={autoRotate}
              rotationYOffsetRef={rotationYOffsetRef}
            />
          </Center>
        </CameraRig>
      </Suspense>
    </Canvas>
  )
}

useGLTF.preload(MODEL_PATH)
