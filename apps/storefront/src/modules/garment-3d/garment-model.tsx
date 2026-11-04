"use client"

import {
  Component,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  type ReactNode,
} from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Decal, useGLTF, useTexture } from "@react-three/drei"
import * as THREE from "three"

export type PrintLayer = {
  url: string
  side: "front" | "back"
  widthMm: number
  heightMm: number
  xMm: number
  yMm: number
  rotation: number
}

export type GarmentPartRole = "front" | "back" | "collar" | "sleeve" | "other"

export type GarmentPart = {
  geometry: THREE.BufferGeometry
  material: THREE.MeshPhysicalMaterial
  role: GarmentPartRole
}

/**
 * Classifies GLB mesh parts by geometric orientation:
 * - avgNormZ > 0.5: Front torso fabric
 * - avgNormZ < -0.5: Back torso fabric
 * - Small vertical height: Collar / hems
 * - Others: Sleeves
 */
function classifyPartRole(geometry: THREE.BufferGeometry): GarmentPartRole {
  if (!geometry.attributes.normal) {
    geometry.computeVertexNormals()
  }
  const normals = geometry.attributes.normal.array
  let sumZ = 0
  for (let i = 2; i < normals.length; i += 3) {
    sumZ += normals[i]
  }
  const avgNormZ = sumZ / (normals.length / 3)

  if (avgNormZ > 0.5) return "front"
  if (avgNormZ < -0.5) return "back"

  geometry.computeBoundingBox()
  const bb = geometry.boundingBox
  const height = bb ? bb.max.y - bb.min.y : 0
  if (height < 0.15) return "collar"
  return "sleeve"
}

class ArtworkErrorBoundary extends Component<
  { children: ReactNode; side: "front" | "back"; url: string },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error(
      `[3D Texture Error]: Failed to load or display ${this.props.side} artwork (${this.props.url.slice(0, 40)}...):`,
      error.message || error,
    )
  }

  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

function Artwork({ layer }: { layer: PrintLayer }) {
  const invalidate = useThree((s) => s.invalidate)
  const source = useTexture(layer.url)
  const texture = useMemo(() => {
    const t = source.clone()
    t.colorSpace = THREE.SRGBColorSpace
    t.needsUpdate = true
    return t
  }, [source])

  // Invalidate when texture loads
  useEffect(() => {
    invalidate()
    return () => texture.dispose()
  }, [texture, invalidate])

  // Invalidate immediately upon any transform change
  useLayoutEffect(() => {
    invalidate()
  }, [
    layer.xMm,
    layer.yMm,
    layer.widthMm,
    layer.heightMm,
    layer.rotation,
    invalidate,
  ])

  const back = layer.side === "back"
  // Geometry-calibrated positions based on /models/nizamlar-tee.glb:
  // Front torso fabric avg Z = +0.035m. Place decal at +0.045m projecting onto front fabric.
  // Back torso fabric avg Z = -0.010m. Place decal at -0.020m projecting onto back fabric.
  const decalPos: [number, number, number] = [
    ((back ? -1 : 1) * layer.xMm) / 1000,
    0.01 - layer.yMm / 1000,
    back ? -0.020 : 0.045,
  ]
  const decalRot: [number, number, number] = [
    0,
    back ? Math.PI : 0,
    (-layer.rotation * Math.PI) / 180,
  ]
  const decalScale: [number, number, number] = [
    layer.widthMm / 1000,
    layer.heightMm / 1000,
    0.15,
  ]

  return (
    <Decal position={decalPos} rotation={decalRot} scale={decalScale}>
      <meshStandardMaterial
        map={texture}
        transparent
        polygonOffset
        polygonOffsetFactor={-6}
        polygonOffsetUnits={-6}
        roughness={0.9}
        depthWrite={false}
      />
    </Decal>
  )
}

export default function GarmentModel({
  color = "#e8e2d6",
  layers = [],
}: {
  color?: string
  layers?: PrintLayer[]
}) {
  const invalidate = useThree((s) => s.invalidate)
  const { scene } = useGLTF("/models/nizamlar-tee.glb")

  const parts = useMemo(() => {
    scene.updateMatrixWorld(true)
    const meshes: GarmentPart[] = []
    scene.traverse((object) => {
      if (!(object as THREE.Mesh).isMesh) return
      const child = object as THREE.Mesh
      const geometry = child.geometry.clone().applyMatrix4(child.matrixWorld)
      const material = (child.material as THREE.MeshPhysicalMaterial).clone()
      material.color.set(color)
      material.roughness = 0.9
      const role = classifyPartRole(geometry)
      meshes.push({ geometry, material, role })
    })
    return meshes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene])

  const target = useMemo(() => new THREE.Color(color), [color])

  useEffect(() => {
    invalidate()
  }, [target, layers, invalidate])

  useFrame((_, delta) => {
    let moving = false
    const step = 1 - Math.exp(-8 * Math.min(delta, 0.1))
    parts.forEach((part) => {
      const dr = Math.abs(part.material.color.r - target.r)
      const dg = Math.abs(part.material.color.g - target.g)
      const db = Math.abs(part.material.color.b - target.b)
      if (dr + dg + db > 0.002) {
        part.material.color.lerp(target, step)
        moving = true
      } else {
        part.material.color.copy(target)
      }
    })
    if (moving) invalidate()
  })

  useEffect(
    () => () =>
      parts.forEach((p) => {
        p.geometry.dispose()
        p.material.dispose()
      }),
    [parts],
  )

  return (
    <group>
      {parts.map((part, index) => (
        <mesh key={index} geometry={part.geometry} material={part.material}>
          {layers
            .filter((layer) => layer.side === part.role)
            .map((layer) => (
              <ArtworkErrorBoundary
                key={`${layer.side}-${layer.url}`}
                side={layer.side}
                url={layer.url}
              >
                <Suspense fallback={null}>
                  <Artwork layer={layer} />
                </Suspense>
              </ArtworkErrorBoundary>
            ))}
        </mesh>
      ))}
    </group>
  )
}

useGLTF.preload("/models/nizamlar-tee.glb")
