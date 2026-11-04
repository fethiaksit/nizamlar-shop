"use client"

import {
  Component,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"

class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? (
      <p role="status" className="p-8 text-center">
        3D görünüm yüklenemedi. Ürün fotoğraflarını kullanabilirsiniz.
      </p>
    ) : (
      this.props.children
    )
  }
}

export default function GarmentScene({
  children,
  interactive = false,
  dark = false,
  onCapture,
}: {
  children: ReactNode
  interactive?: boolean
  dark?: boolean
  onCapture?: (capture: () => string) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const element = host.current
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "150px" },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={host} className="h-full w-full" data-testid="garment-scene">
      <SceneBoundary>
        <Canvas
          camera={{ position: [0, 0, 1.75], fov: 34 }}
          dpr={[1, 1.35]}
          frameloop={visible ? "demand" : "never"}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            preserveDrawingBuffer: !!onCapture,
          }}
          onCreated={({ gl, invalidate }) => {
            invalidate()
            onCapture?.(() => {
              invalidate()
              return gl.domElement.toDataURL("image/png")
            })
          }}
        >
          <ambientLight intensity={dark ? 1.3 : 1.8} />
          <directionalLight position={[2, 3, 4]} intensity={3.2} />
          <directionalLight
            position={[-3, 0, 2]}
            intensity={1.4}
            color="#f0d8aa"
          />
          <directionalLight position={[0, 2, -3]} intensity={2} />
          <Suspense fallback={null}>{children}</Suspense>
          {interactive && (
            <OrbitControls
              makeDefault
              enableZoom
              enablePan={false}
              minDistance={1}
              maxDistance={2.6}
              minPolarAngle={0.5}
              maxPolarAngle={2.5}
            />
          )}
        </Canvas>
      </SceneBoundary>
    </div>
  )
}
