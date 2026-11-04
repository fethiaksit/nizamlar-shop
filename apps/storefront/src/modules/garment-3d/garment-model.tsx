"use client"

import { useEffect, useMemo } from "react"
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

function Artwork({ layer }: { layer: PrintLayer }) {
  const invalidate = useThree((s) => s.invalidate)
  const source = useTexture(layer.url)
  const texture = useMemo(() => {
    const t = source.clone()
    t.colorSpace = THREE.SRGBColorSpace
    t.needsUpdate = true
    return t
  }, [source])
  useEffect(() => {
    invalidate()
    return () => texture.dispose()
  }, [texture, invalidate])
  const back = layer.side === "back"
  return (
    <Decal
      position={[
        ((back ? -1 : 1) * layer.xMm) / 1000,
        0.01 - layer.yMm / 1000,
        back ? -0.065 : 0.075,
      ]}
      rotation={[0, back ? Math.PI : 0, (-layer.rotation * Math.PI) / 180]}
      scale={[layer.widthMm / 1000, layer.heightMm / 1000, 0.16]}
    >
      <meshStandardMaterial
        map={texture}
        transparent
        polygonOffset
        polygonOffsetFactor={-4}
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
    const meshes: {
      geometry: THREE.BufferGeometry
      material: THREE.MeshPhysicalMaterial
    }[] = []
    scene.traverse((object) => {
      if (!(object as THREE.Mesh).isMesh) return
      const child = object as THREE.Mesh
      const geometry = child.geometry.clone().applyMatrix4(child.matrixWorld)
      const material = (child.material as THREE.MeshPhysicalMaterial).clone()
      material.color.set(color)
      material.roughness = 0.9
      meshes.push({ geometry, material })
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
        <mesh
          key={index}
          geometry={part.geometry}
          material={part.material}
        >
          {layers
            .filter((layer) =>
              layer.side === "front" ? index === 0 : index === 1,
            )
            .map((layer) => (
              <Artwork key={`${layer.side}-${layer.url}`} layer={layer} />
            ))}
        </mesh>
      ))}
    </group>
  )
}

useGLTF.preload("/models/nizamlar-tee.glb")
