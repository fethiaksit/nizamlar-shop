import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { queryDb } from "../../../../../lib/db"

/**
 * DELETE /admin/site-management/media/:id
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const deleted = await queryDb(
      "DELETE FROM site_media WHERE id = $1 RETURNING *;",
      [id]
    )
    if (deleted.length === 0) {
      return res.status(404).json({ message: "Silinecek medya bulunamadı." })
    }
    return res.status(200).json({ message: "Medya dosyası başarıyla silindi.", id })
  } catch (error: any) {
    return res.status(500).json({ message: "Medya silinemedi.", error: error.message })
  }
}
