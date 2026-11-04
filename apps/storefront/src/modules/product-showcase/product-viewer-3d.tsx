"use client"

import GarmentScene from "@modules/garment-3d/scene"
import GarmentModel from "@modules/garment-3d/garment-model"

export default function ProductViewer3D({
  colorHex = "#e8e2d6",
}: {
  colorHex?: string
}) {
  return (
    <div
      className="aura-viewer"
      data-testid="product-viewer"
      data-color={colorHex}
    >
      <span className="aura-viewer-note">360° · Döndürmek için sürükleyin</span>
      <GarmentScene interactive>
        <GarmentModel color={colorHex} />
      </GarmentScene>
      <span className="aura-viewer-bottom">NİZAMLAR / TEXTILE STUDIO</span>
    </div>
  )
}
