import type { Metadata } from "next"
import DeliveryPageClient from "./DeliveryPageClient"

export const metadata: Metadata = {
  title: "Доставка и оплата",
  description: "Информация о доставке и оплате",
}

export default function DeliveryPage() {
  return <DeliveryPageClient />
}
