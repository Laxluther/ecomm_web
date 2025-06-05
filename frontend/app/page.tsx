import type { Metadata } from "next"
import { generateSEO } from "@/lib/seo"
import { HomePage } from "@/components/pages/home-page"

export const metadata: Metadata = generateSEO({
  title: "Forest Store - Premium Natural Products | Honey, Coffee, Nuts & Seeds",
  description:
    "Discover premium natural products including pure forest honey, organic coffee beans, premium nuts, and super seeds. Quality guaranteed, sourced directly from nature.",
  keywords: ["natural products", "forest honey", "organic coffee", "premium nuts", "super seeds", "healthy food"],
})

export default function Home() {
  return <HomePage />
}
