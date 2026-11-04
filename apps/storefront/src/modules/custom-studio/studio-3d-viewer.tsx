"use client"

import { useEffect, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import GarmentScene from "@modules/garment-3d/scene"
import GarmentModel, {
  type PrintLayer,
} from "@modules/garment-3d/garment-model"

function FacingShirt({
  side,
  color,
  layers,
}: {
  side: "front" | "back"
  color: string
  layers: PrintLayer[]
}) {
  const group = useRef<THREE.Group>(null)
  const invalidate = useThree((s) => s.invalidate)
  const targetY = side === "back" ? Math.PI : 0

  useEffect(() => {
    invalidate()
  }, [targetY, invalidate])

  useFrame((_, dt) => {
    if (!group.current) return
    if (Math.abs(group.current.rotation.y - targetY) > 0.002) {
      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        targetY,
        7,
        Math.min(dt, 0.1),
      )
      invalidate()
    } else {
      group.current.rotation.y = targetY
    }
  })

  return (
    <group ref={group} rotation={[0, targetY, 0]}>
      <GarmentModel color={color} layers={layers} />
    </group>
  )
}

export default function Studio3DViewer({
  color,
  layers,
  side,
  capture,
  resetKey = 0,
}: {
  color: string
  layers: PrintLayer[]
  side: "front" | "back"
  capture?: (callback: () => string) => void
  resetKey?: number
}) {
  return (
    <GarmentScene key={resetKey} interactive dark onCapture={capture}>
      <FacingShirt side={side} color={color} layers={layers} />
    </GarmentScene>
  )
}
