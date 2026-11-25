import { Metadata } from "next"
import OrderTrackingClient from "@modules/order-tracking"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Track Your DTF Transfer Order | Nizamlar DTF USA",
  description:
    "Real-time 8-stage DTF production status and international US air express tracking.",
}

export default function OrderTrackingPage() {
  return <OrderTrackingClient />
}
