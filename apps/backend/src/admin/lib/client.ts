export async function adminFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(endpoint, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      return { error: json.message || `İşlem başarısız oldu (${res.status})` }
    }

    return { data: json }
  } catch (err: any) {
    return { error: err.message || "Ağ veya bağlantı hatası oluştu." }
  }
}
