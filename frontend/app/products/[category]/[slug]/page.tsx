import type { Metadata } from "next"
import { getSofaBySlug, getBedBySlug } from "@/shared/api/api"
import ProductDetail from "@/widgets/product-detail/ui/ProductDetail"
import RecentlyViewed from "@/widgets/recently-viewed/ui/RecentlyViewed"
import { notFound } from "next/navigation"

interface ProductPageProps {
  params: {
    category: string
    slug: string
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { category, slug } = params

  let product
  if (category === "sofa") {
    product = await getSofaBySlug(slug)
  } else if (category === "bed") {
    product = await getBedBySlug(slug)
  }

  if (!product) {
    return {
      title: "Товар не найден",
      description: "Запрашиваемый товар не найден",
    }
  }

  return {
    title: product.name,
    description: product.description,
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { category, slug } = params

  let product
  if (category === "sofa") {
    product = await getSofaBySlug(slug)
  } else if (category === "bed") {
    product = await getBedBySlug(slug)
  }

  if (!product) {
    notFound()
  }

  return (
    <>
      <ProductDetail product={product} />
      <RecentlyViewed />
    </>
  )
}
