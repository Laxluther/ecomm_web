"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { api } from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

interface Category {
  category_id: number
  category_name: string
  description: string
  image_url: string
  product_count: number
}

export function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await api.getCategories()
      if (response.data?.categories) {
        setCategories(response.data.categories.slice(0, 8))
      }
    } catch (error) {
      console.error("Failed to load categories:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-16 bg-cream-50">
        <div className="container">
          <div className="flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-cream-50">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-brown-900 mb-4 font-serif">Shop by Category</h2>
          <p className="text-brown-600 max-w-2xl mx-auto text-lg">
            Explore our comprehensive collection of brewing supplies and equipment
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link key={category.category_id} href={`/products?category=${category.category_id}`} className="group">
              <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="aspect-square relative overflow-hidden">
                  <Image
                    src={category.image_url || `/placeholder.svg?height=200&width=200`}
                    alt={category.category_name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-semibold text-brown-900 mb-1 group-hover:text-amber-600 transition-colors">
                    {category.category_name}
                  </h3>
                  <p className="text-sm text-brown-600">{category.product_count} products</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
