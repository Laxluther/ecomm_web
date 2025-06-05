"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { ProductCard } from "@/components/products/ProductCard"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { api } from "@/lib/api"
import type { Product } from "@/types/api"

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await api.products.getFeatured()
        setProducts(response.products.slice(0, 4)) // Show only 4 products
      } catch (error) {
        console.error("Failed to fetch featured products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedProducts()
  }, [])

  if (loading) {
    return (
      <section className="py-16">
        <div className="container">
          <div className="text-center">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-white">
      <div className="container">
        <div className="text-center space-y-4 mb-12">
          <h2 className="section-title">Featured Brewing Kits</h2>
          <p className="section-subtitle">
            Discover our most popular brewing kits, perfect for beginners and experts alike.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {products.map((product) => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>

        <div className="text-center">
          <Link href="/products">
            <Button size="lg">View All Products</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
