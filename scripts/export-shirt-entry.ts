import * as THREE from "three"
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js"
import { createWardrobe } from "../apps/storefront/src/modules/clothes-rack/garment"

// Derive a reusable metric garment from the commercially permitted DiMaac drape.
// No model or artwork from the unlicensed reference repositories is included.
Object.assign(window, {
  exportNizamlarShirt: async () => {
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    const wardrobe = createWardrobe(renderer)
    const garment = wardrobe.garment({ kind: "tee", colour: "#ffffff" }, "wood")
    const shirt = new THREE.Group()
    for (const child of garment.turn.children.slice(0, -2)) {
      const mesh = (child as THREE.Mesh).clone()
      const source = mesh.material as THREE.MeshPhysicalMaterial
      mesh.material = new THREE.MeshPhysicalMaterial({
        map: source.map,
        color: "#ffffff",
        roughness: 0.92,
        sheen: 0.3,
        sheenRoughness: 0.85,
        side: THREE.DoubleSide,
      })
      shirt.add(mesh)
    }
    const box = new THREE.Box3().setFromObject(shirt)
    const center = box.getCenter(new THREE.Vector3())
    for (const child of shirt.children) child.position.sub(center)
    shirt.name = "Nizamlar metric cotton tee — DiMaac drape adaptation"
    shirt.userData = {
      source: "https://ui.dimaac.com/r/clothes-rack.json",
      license:
        "DiMaac free component commercial use; https://ui.dimaac.com/docs#licence",
      units: "metres",
      center: center.toArray(),
      dimensions: box.getSize(new THREE.Vector3()).toArray(),
    }
    const glb = (await new GLTFExporter().parseAsync(shirt, {
      binary: true,
    })) as ArrayBuffer
    const bytes = new Uint8Array(glb)
    let binary = ""
    for (let i = 0; i < bytes.length; i += 8192)
      binary += String.fromCharCode(...bytes.subarray(i, i + 8192))
    garment.dispose()
    wardrobe.dispose()
    renderer.dispose()
    return { data: btoa(binary), dimensions: shirt.userData.dimensions }
  },
})
