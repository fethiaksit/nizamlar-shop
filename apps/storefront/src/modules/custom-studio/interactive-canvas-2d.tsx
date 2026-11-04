"use client"

import { useRef, useState, useMemo, useCallback } from "react"
import { printPlacement } from "@lib/3d/product"
import { generateProductSvgString } from "./mockup-engine"

export type Artwork = {
  url: string
  fileName: string
  mime: string
  aspect: number
  widthMm: number
  xMm: number
  yMm: number
  rotation: number
}

type DragMode =
  | "none"
  | "move"
  | "resize-se"
  | "resize-sw"
  | "resize-ne"
  | "resize-nw"
  | "rotate"

interface InteractiveCanvas2DProps {
  side: "front" | "back"
  color: string
  artwork?: Artwork
  onUpdate: (patch: Partial<Artwork>, pushToHistory?: boolean) => void
  onUploadClick: () => void
  onFileDrop: (file: File) => void
}

// 600x680 SVG coordinate mapping:
// 320 mm wide torso maps to 230 px.
// S = 230 / 320 px/mm (~0.71875 px/mm)
// Printable area center: (300, 330)
const SVG_CENTER_X = 300
const SVG_CENTER_Y = 330
const SCALE = 230 / 320
const BOX_WIDTH = 320 * SCALE // 230 px
const BOX_HEIGHT = 400 * SCALE // 287.5 px
const BOX_X = SVG_CENTER_X - BOX_WIDTH / 2 // 185 px
const BOX_Y = SVG_CENTER_Y - BOX_HEIGHT / 2 // 186.25 px

export default function InteractiveCanvas2D({
  side,
  color,
  artwork,
  onUpdate,
  onUploadClick,
  onFileDrop,
}: InteractiveCanvas2DProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragMode, setDragMode] = useState<DragMode>("none")
  const [isDragOver, setIsDragOver] = useState(false)
  const [snapX, setSnapX] = useState(false)
  const [snapY, setSnapY] = useState(false)

  // Drag interaction refs to prevent stale closure during pointermove
  const dragStartRef = useRef<{
    startX: number
    startY: number
    startXMm: number
    startYMm: number
    startWidthMm: number
    startRotation: number
    aspect: number
  }>({
    startX: 0,
    startY: 0,
    startXMm: 0,
    startYMm: 0,
    startWidthMm: 120,
    startRotation: 0,
    aspect: 1,
  })

  // Generate background SVG data URI
  const backgroundSvgUri = useMemo(() => {
    const rawSvg = generateProductSvgString("tisort", side, color, "240 GSM PENYE")
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(rawSvg)}`
  }, [side, color])

  // Convert client pointer coordinates to SVG coordinate space
  const getSvgCoordinates = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    return pt.matrixTransform(ctm.inverse())
  }, [])

  // Physical placement validation
  const placement = useMemo(() => {
    if (!artwork) return null
    return printPlacement(artwork)
  }, [artwork])

  const isValid = placement?.valid ?? true

  // Current artwork SVG dimensions and center
  const artworkSvg = useMemo(() => {
    if (!artwork) return null
    const w = artwork.widthMm * SCALE
    const h = (artwork.widthMm / (artwork.aspect || 1)) * SCALE
    const cx = SVG_CENTER_X + artwork.xMm * SCALE
    const cy = SVG_CENTER_Y + artwork.yMm * SCALE
    return { w, h, cx, cy }
  }, [artwork])

  // Start Move
  const handlePointerDownMove = (e: React.PointerEvent) => {
    if (!artwork) return
    if (e.pointerType === "mouse" && e.button !== 0) return
    e.stopPropagation()
    try {
      ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)
    } catch {
      // ignore
    }
    const { x, y } = getSvgCoordinates(e.clientX, e.clientY)
    dragStartRef.current = {
      startX: x,
      startY: y,
      startXMm: artwork.xMm,
      startYMm: artwork.yMm,
      startWidthMm: artwork.widthMm,
      startRotation: artwork.rotation,
      aspect: artwork.aspect || 1,
    }
    setDragMode("move")
  }

  // Start Resize
  const handlePointerDownResize = (mode: DragMode, e: React.PointerEvent) => {
    if (!artwork) return
    if (e.pointerType === "mouse" && e.button !== 0) return
    e.stopPropagation()
    try {
      ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)
    } catch {
      // ignore
    }
    const { x, y } = getSvgCoordinates(e.clientX, e.clientY)
    dragStartRef.current = {
      startX: x,
      startY: y,
      startXMm: artwork.xMm,
      startYMm: artwork.yMm,
      startWidthMm: artwork.widthMm,
      startRotation: artwork.rotation,
      aspect: artwork.aspect || 1,
    }
    setDragMode(mode)
  }

  // Start Rotate
  const handlePointerDownRotate = (e: React.PointerEvent) => {
    if (!artwork) return
    if (e.pointerType === "mouse" && e.button !== 0) return
    e.stopPropagation()
    try {
      ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)
    } catch {
      // ignore
    }
    const { x, y } = getSvgCoordinates(e.clientX, e.clientY)
    dragStartRef.current = {
      startX: x,
      startY: y,
      startXMm: artwork.xMm,
      startYMm: artwork.yMm,
      startWidthMm: artwork.widthMm,
      startRotation: artwork.rotation,
      aspect: artwork.aspect || 1,
    }
    setDragMode("rotate")
  }

  // Pointer Move Handler
  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragMode === "none" || !artwork || !artworkSvg) return
    const { x, y } = getSvgCoordinates(e.clientX, e.clientY)
    const start = dragStartRef.current

    if (dragMode === "move") {
      const dxSvg = x - start.startX
      const dySvg = y - start.startY
      let newXMm = Math.round(start.startXMm + dxSvg / SCALE)
      let newYMm = Math.round(start.startYMm + dySvg / SCALE)

      // Snap to center
      if (Math.abs(newXMm) <= 4) {
        newXMm = 0
        setSnapX(true)
      } else {
        setSnapX(false)
      }

      if (Math.abs(newYMm) <= 4) {
        newYMm = 0
        setSnapY(true)
      } else {
        setSnapY(false)
      }

      // Keep within broad limits
      newXMm = Math.max(-150, Math.min(150, newXMm))
      newYMm = Math.max(-190, Math.min(190, newYMm))

      onUpdate({ xMm: newXMm, yMm: newYMm }, false)
    } else if (dragMode.startsWith("resize")) {
      // Local coordinate calculation accounting for rotation
      const rad = (-artwork.rotation * Math.PI) / 180
      const dx = x - artworkSvg.cx
      const dy = y - artworkSvg.cy
      const localX = Math.abs(dx * Math.cos(rad) - dy * Math.sin(rad))

      let newWidthMm = Math.round((localX * 2) / SCALE)
      newWidthMm = Math.max(25, Math.min(300, newWidthMm))

      onUpdate({ widthMm: newWidthMm }, false)
    } else if (dragMode === "rotate") {
      const dx = x - artworkSvg.cx
      const dy = y - artworkSvg.cy
      let angle = Math.round((Math.atan2(dy, dx) * 180) / Math.PI + 90)
      if (angle > 180) angle -= 360
      if (angle < -180) angle += 360

      // Snap to key angles (0, 90, -90, 180)
      if (Math.abs(angle) <= 3) angle = 0
      else if (Math.abs(angle - 90) <= 3) angle = 90
      else if (Math.abs(angle + 90) <= 3) angle = -90
      else if (Math.abs(Math.abs(angle) - 180) <= 3) angle = 180

      onUpdate({ rotation: angle }, false)
    }
  }

  // Pointer Up Handler - commits the change to history
  const handlePointerUp = () => {
    if (dragMode !== "none") {
      setDragMode("none")
      setSnapX(false)
      setSnapY(false)
      if (artwork) {
        // Push final state to history
        onUpdate(
          {
            xMm: artwork.xMm,
            yMm: artwork.yMm,
            widthMm: artwork.widthMm,
            rotation: artwork.rotation,
          },
          true,
        )
      }
    }
  }

  return (
    <div
      className="relative w-full h-full flex items-center justify-center select-none overflow-hidden touch-none"
      style={{ touchAction: "none" }}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragOver(false)
        const file = e.dataTransfer.files?.[0]
        if (file) onFileDrop(file)
      }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 600 680"
        className="w-full h-full max-h-[640px] drop-shadow-xl"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <defs>
          <filter id="shadow2d" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* 1. Tişört Mockup Arka Planı */}
        <image
          href={backgroundSvgUri}
          x="0"
          y="0"
          width="600"
          height="680"
          preserveAspectRatio="xMidYMid meet"
        />

        {/* 2. 320 x 400 mm Baskı Alanı Sınır Çerçevesi */}
        <g>
          <rect
            x={BOX_X}
            y={BOX_Y}
            width={BOX_WIDTH}
            height={BOX_HEIGHT}
            fill="none"
            stroke={isValid ? "rgba(178, 148, 96, 0.45)" : "#EF4444"}
            strokeWidth="1.5"
            strokeDasharray="5 4"
            rx="4"
          />
          {/* Baskı Alanı Başlık Etiketi */}
          <text
            x={BOX_X + 6}
            y={BOX_Y + 14}
            fill={isValid ? "rgba(243, 239, 231, 0.65)" : "#EF4444"}
            fontSize="8.5"
            fontFamily="monospace"
            letterSpacing="0.5"
          >
            BASKI ALANI · 320 × 400 MM
          </text>
        </g>

        {/* 3. Snap Hizalama Kılavuz Çizgileri */}
        {snapX && (
          <line
            x1={SVG_CENTER_X}
            y1={BOX_Y}
            x2={SVG_CENTER_X}
            y2={BOX_Y + BOX_HEIGHT}
            stroke="#B29460"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}
        {snapY && (
          <line
            x1={BOX_X}
            y1={SVG_CENTER_Y}
            x2={BOX_X + BOX_WIDTH}
            y2={SVG_CENTER_Y}
            stroke="#B29460"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}

        {/* 4. Tasarım Varsa: Etkileşimli Baskı Görseli ve Tutamaçlar */}
        {artwork && artworkSvg ? (
          <g
            transform={`rotate(${artwork.rotation} ${artworkSvg.cx} ${artworkSvg.cy})`}
            className="cursor-move"
          >
            {/* Orijinal Baskı Görseli */}
            <image
              href={artwork.url}
              x={artworkSvg.cx - artworkSvg.w / 2}
              y={artworkSvg.cy - artworkSvg.h / 2}
              width={artworkSvg.w}
              height={artworkSvg.h}
              preserveAspectRatio="none"
              filter="url(#shadow2d)"
              onPointerDown={handlePointerDownMove}
            />

            {/* Seçim & Sınır Kutusu */}
            <rect
              x={artworkSvg.cx - artworkSvg.w / 2}
              y={artworkSvg.cy - artworkSvg.h / 2}
              width={artworkSvg.w}
              height={artworkSvg.h}
              fill="transparent"
              stroke={isValid ? "#B29460" : "#EF4444"}
              strokeWidth="1.5"
              strokeDasharray={isValid ? "none" : "4 3"}
              onPointerDown={handlePointerDownMove}
            />

            {/* Döndürme Sapı ve Tutamacı */}
            <line
              x1={artworkSvg.cx}
              y1={artworkSvg.cy - artworkSvg.h / 2}
              x2={artworkSvg.cx}
              y2={artworkSvg.cy - artworkSvg.h / 2 - 24}
              stroke="#B29460"
              strokeWidth="1.5"
            />
            <circle
              cx={artworkSvg.cx}
              y={artworkSvg.cy - artworkSvg.h / 2 - 24}
              r="6"
              fill="#B29460"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              className="cursor-crosshair transition-transform hover:scale-125"
              onPointerDown={handlePointerDownRotate}
            />

            {/* 4 Köşe Boyutlandırma Tutamaçları */}
            {/* Sol-Üst */}
            <circle
              cx={artworkSvg.cx - artworkSvg.w / 2}
              y={artworkSvg.cy - artworkSvg.h / 2}
              r="5.5"
              fill="#FFFFFF"
              stroke="#B29460"
              strokeWidth="1.5"
              className="cursor-nwse-resize hover:scale-125"
              onPointerDown={(e) => handlePointerDownResize("resize-nw", e)}
            />
            {/* Sağ-Üst */}
            <circle
              cx={artworkSvg.cx + artworkSvg.w / 2}
              y={artworkSvg.cy - artworkSvg.h / 2}
              r="5.5"
              fill="#FFFFFF"
              stroke="#B29460"
              strokeWidth="1.5"
              className="cursor-nesw-resize hover:scale-125"
              onPointerDown={(e) => handlePointerDownResize("resize-ne", e)}
            />
            {/* Sol-Alt */}
            <circle
              cx={artworkSvg.cx - artworkSvg.w / 2}
              y={artworkSvg.cy + artworkSvg.h / 2}
              r="5.5"
              fill="#FFFFFF"
              stroke="#B29460"
              strokeWidth="1.5"
              className="cursor-nesw-resize hover:scale-125"
              onPointerDown={(e) => handlePointerDownResize("resize-sw", e)}
            />
            {/* Sağ-Alt */}
            <circle
              cx={artworkSvg.cx + artworkSvg.w / 2}
              y={artworkSvg.cy + artworkSvg.h / 2}
              r="5.5"
              fill="#FFFFFF"
              stroke="#B29460"
              strokeWidth="1.5"
              className="cursor-nwse-resize hover:scale-125"
              onPointerDown={(e) => handlePointerDownResize("resize-se", e)}
            />
          </g>
        ) : (
          /* 5. Tasarım Yoksa: Çağrışımlı Yükleme Alanı */
          <g
            className="cursor-pointer transition-opacity hover:opacity-90"
            style={{ pointerEvents: "all" }}
            onClick={onUploadClick}
            onPointerDown={(e) => {
              if (e.pointerType !== "mouse" || e.button === 0) {
                onUploadClick()
              }
            }}
          >
            <rect
              x={BOX_X + 20}
              y={BOX_Y + 40}
              width={BOX_WIDTH - 40}
              height={BOX_HEIGHT - 80}
              fill="rgba(34, 35, 37, 0.65)"
              stroke="rgba(178, 148, 96, 0.45)"
              strokeWidth="1.5"
              strokeDasharray="6 4"
              rx="8"
            />
            <circle
              cx={SVG_CENTER_X}
              cy={SVG_CENTER_Y - 20}
              r="20"
              fill="rgba(178, 148, 96, 0.25)"
              stroke="#B29460"
              strokeWidth="1.5"
            />
            <text
              x={SVG_CENTER_X}
              y={SVG_CENTER_Y - 13}
              fill="#B29460"
              fontSize="20"
              fontWeight="bold"
              textAnchor="middle"
            >
              +
            </text>
            <text
              x={SVG_CENTER_X}
              y={SVG_CENTER_Y + 16}
              fill="#F3EFE7"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
            >
              {side === "front" ? "Ön Yüze Logo / Görsel Ekle" : "Arka Yüze Logo / Görsel Ekle"}
            </text>
            <text
              x={SVG_CENTER_X}
              y={SVG_CENTER_Y + 34}
              fill="rgba(243, 239, 231, 0.7)"
              fontSize="8.5"
              textAnchor="middle"
            >
              PNG, JPG, WebP veya SVG · Dokunun veya sürükleyin
            </text>
          </g>
        )}
      </svg>

      {/* Sürükle-Bırak Aktif Göstergesi */}
      {isDragOver && (
        <div className="absolute inset-4 z-20 flex flex-col items-center justify-center bg-[#222325]/90 border-2 border-dashed border-[#B29460] rounded-xl backdrop-blur-sm animate-pulse pointer-events-none">
          <p className="text-[#B29460] font-bold text-base mb-1">Görseli Buraya Bırakın</p>
          <p className="text-[#F3EFE7] text-xs">Maksimum 25 MB · PNG, JPG veya WebP</p>
        </div>
      )}

      {/* Alan Dışı Uyarı Rozeti */}
      {artwork && !isValid && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 bg-red-950/90 border border-red-500/80 rounded-md shadow-lg flex items-center gap-2 text-red-200 text-xs font-semibold">
          <span>⚠️</span>
          <span>Baskı 320 × 400 mm sınırını aşıyor! Lütfen boyutu küçültün veya içeri kaydırın.</span>
        </div>
      )}
    </div>
  )
}
