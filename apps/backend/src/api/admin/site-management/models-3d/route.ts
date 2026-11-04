import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { queryDb } from "../../../../lib/db"

/**
 * GET /admin/site-management/models-3d
 * Sistemde kayıtlı 3D modelleri döner
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const models = await queryDb(
      "SELECT * FROM site_media WHERE file_type = '3d_model' OR category = 'model3d' ORDER BY created_at DESC;"
    )

    // Yerleşik standart modeller
    const builtInModels = [
      {
        id: "built-in-tee",
        title: "Nizamlar Penye Tişört GLB",
        file_name: "nizamlar-tee.glb",
        file_url: "/models/nizamlar-tee.glb",
        file_type: "3d_model",
        category: "model3d",
        is_default: true,
      },
      {
        id: "built-in-baked",
        title: "T-Shirt Baked Studio Mesh",
        file_name: "shirt_baked.glb",
        file_url: "/tshirt3d/shirt_baked.glb",
        file_type: "3d_model",
        category: "model3d",
        is_default: false,
      },
    ]

    return res.status(200).json({ models: [...builtInModels, ...models] })
  } catch (error: any) {
    return res.status(500).json({ message: "3D modeller okunamadı.", error: error.message })
  }
}
