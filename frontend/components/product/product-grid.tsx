"use client"

import { ProductCard } from "./product-card"
import { useCartStore } from "@/lib/store"
import { useAuth } from "@/lib/auth"
import toast from "react-hot-toast"
import api from "@/lib/api"

interface Product {
  product_id: number
  product_name: string
  price: number
  discount_price: number
  primary_image: string
  savings: number
  in_stock: boolean
  category_name: string
  brand: string
}

interface ProductGridProps {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  const { addItem } = useCartStore()
  const { isAuthenticated } = useAuth()

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart")
      return
    }

    try {
      await api.post("/cart/add", {
        product_id: product.product_id,
        quantity: 1,
      })

      addItem({
        cart_id: Date.now(),
        product_id: product.product_id,
        product_name: product.product_name,
        quantity: 1,
        price: product.price,
        discount_price: product.discount_price,
        image_url: product.primary_image,
      })

      toast.success(`${product.product_name} added to cart!`)
    } catch (error) {
      console.error("Error adding item to cart:", error)
      toast.error("Failed to add item to cart")
    }
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No products found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.product_id} product={product} onAddToCart={() => handleAddToCart(product)} />
      ))}
    </div>
  )
}
