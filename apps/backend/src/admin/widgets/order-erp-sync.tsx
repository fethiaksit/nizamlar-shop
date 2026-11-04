import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"

const OrderErpSyncWidget = ({ data }: { data: any }) => {
  const orderId = data?.id
  const [syncData, setSyncData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRetrying, setIsRetrying] = useState<boolean>(false)

  const fetchSyncStatus = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/admin/orders/${orderId}/erp-sync`, {
        headers: { "Content-Type": "application/json" },
      })
      if (res.ok) {
        const json = await res.json()
        setSyncData(json)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (orderId) {
      fetchSyncStatus()
    }
  }, [orderId])

  const handleManualSync = async () => {
    try {
      setIsRetrying(true)
      const res = await fetch(`/admin/orders/${orderId}/erp-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (res.ok) {
        await fetchSyncStatus()
        alert("ERP aktarım işlemi başarıyla yenilendi.")
      } else {
        alert("ERP aktarımı başarısız oldu.")
      }
    } catch (e: any) {
      alert(`Hata: ${e.message}`)
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
          <h3 className="text-base font-semibold text-gray-900">
            Nizamlar ERP & Özel Baskı Üretim Durumu
          </h3>
        </div>
        <button
          onClick={handleManualSync}
          disabled={isRetrying}
          className="px-3 py-1.5 text-xs font-semibold rounded bg-[#D4AF37] hover:bg-[#C49F27] text-gray-900 transition-colors disabled:opacity-50"
        >
          {isRetrying ? "Aktarılıyor..." : "🔄 ERP'ye Yeniden Aktar"}
        </button>
      </div>

      {isLoading ? (
        <p className="text-xs text-gray-500">ERP ve tasarım verileri yükleniyor...</p>
      ) : (
        <div className="flex flex-col gap-4 text-xs">
          {/* Müşteri ve Üretim İş Emri Referansı */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded border border-gray-200">
            <div>
              <span className="text-gray-500 block text-[11px]">Müşteri Bilgisi:</span>
              <span className="font-semibold text-gray-800">
                {data?.customer?.first_name || data?.shipping_address?.first_name || "Müşteri"}{" "}
                {data?.customer?.last_name || data?.shipping_address?.last_name || ""} (
                {data?.email || "E-posta belirtilmemiş"})
              </span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px]">Üretim İş Emri Referansı:</span>
              <span className="font-mono font-bold text-amber-700">
                NZM-WO-{(orderId || "000000").slice(-6).toUpperCase()}
              </span>
            </div>
          </div>

          {/* ERP Senkronizasyon Durumu */}
          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-1">ERP Aktarım Kaydı:</h4>
            {syncData?.syncLogs && syncData.syncLogs.length > 0 ? (
              <div className="space-y-1">
                {syncData.syncLogs.map((log: any) => (
                  <div key={log.id} className="flex justify-between items-center">
                    <span>
                      Durum:{" "}
                      <strong
                        className={
                          log.status === "success" ? "text-green-600" : "text-amber-600"
                        }
                      >
                        {log.status.toUpperCase()}
                      </strong>{" "}
                      (Cari: {log.erp_customer_id || "Otomatik Eşleşti"})
                    </span>
                    <span className="text-gray-400">
                      {new Date(log.created_at).toLocaleString("tr-TR")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-amber-700">
                ⚠️ Henüz ERP aktarım kaydı bulunmuyor (Ödeme onayı bekleniyor).
              </p>
            )}
          </div>

          {/* Özel Baskı ve Tasarım Dosyaları */}
          {syncData?.designs && syncData.designs.length > 0 ? (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Özel Baskı Tasarımları:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {syncData.designs.map((des: any) => (
                  <div
                    key={des.id}
                    className="p-3 border rounded bg-gray-50 flex flex-col gap-2"
                  >
                    <div className="flex justify-between font-semibold items-center">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border"
                          style={{ backgroundColor: des.color_hex || "#202020" }}
                        />
                        <span>{des.position_name}</span>
                      </div>
                      <span className="text-[#D4AF37] font-mono text-[11px]">{des.id}</span>
                    </div>
                    <div className="text-gray-600 space-y-0.5">
                      <div>Renk / Beden: {des.color_name} / {des.size}</div>
                      <div>Baskı Yüzeyi: {des.view === "front" ? "Ön Yüz" : "Sırt"}</div>
                      <div>
                        Baskı Tekniği & Ölçü:{" "}
                        <strong>
                          {des.physical_dimensions?.widthMm
                            ? `${des.physical_dimensions.widthMm} × ${des.physical_dimensions.heightMm} mm (DTF)`
                            : "Standart A4 (DTF)"}
                        </strong>
                      </div>
                      <div className="truncate">Dosya: {des.original_file_name}</div>
                    </div>
                    <div className="pt-2 border-t flex justify-end">
                      <a
                        href={`/admin/custom-designs/${des.id}/original`}
                        download
                        className="px-2.5 py-1 rounded bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
                      >
                        📥 Orijinal Baskı Dosyasını İndir
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">
              Bu siparişte özel baskılı ürün bulunmuyor (Standart Hazır Ürün).
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.before",
})

export default OrderErpSyncWidget
