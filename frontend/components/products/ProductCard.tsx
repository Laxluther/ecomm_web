"use client"

import { useState } from "react"
import Link from "next/link"
import { Heart, ShoppingCart, Star } from "lucide-react"
import { Button } from "@/components/ui/Button"

interface Product {
  product_id: number
  product_name: string
  price: number
  discount_price?: number
  primary_image: string
  average_rating?: number
  total_reviews?: number
  savings?: number
  savings_percentage?: number
  in_stock: boolean
  category_name?: string
  brand?: string
}

interface ProductCardProps {
  product: Product
  onAddToCart: (productId: number) => void
  onToggleWishlist: (productId: number) => void
  isInWishlist: boolean
}

export function ProductCard({ product, onAddToCart, onToggleWishlist, isInWishlist }: ProductCardProps) {
  const [loading, setLoading] = useState(false)

  const hasDiscount = product.discount_price && product.discount_price < product.price
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
    : 0

  const handleAddToCart = async () => {
    setLoading(true)
    try {
      await onAddToCart(product.product_id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="product-card group">
      {/* Image Container */}
      <div className="relative overflow-hidden">
        <Link href={`/products/${product.product_id}`}>
          <img
            src={product.primary_image || "/placeholder.svg?height=300&width=300"}
            alt={product.product_name}
            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 space-y-2">
          {hasDiscount && <span className="badge badge-primary">{discountPercentage}% OFF</span>}
          {!product.in_stock && <span className="badge bg-red-500 text-white">Out of Stock</span>}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={() => onToggleWishlist(product.product_id)}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
            isInWishlist ? "bg-red-500 text-white" : "bg-white/80 text-green-800 hover:bg-white"
          }`}
        >
          <Heart className={`h-4 w-4 ${isInWishlist ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <Link href={`/products/${product.product_id}`}>
            <h3 className="font-heading font-bold text-green-800 hover:text-green-600 transition-colors line-clamp-2">
              {product.product_name}
            </h3>
          </Link>
          {product.brand && <p className="text-sm text-green-600 font-medium">{product.brand}</p>}
        </div>

        {/* Rating */}
        {product.average_rating && (
          <div className="flex items-center space-x-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.average_rating!) ? "text-yellow-400 fill-current" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-green-700">({product.total_reviews})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-green-800">
                ${(product.discount_price || product.price).toFixed(2)}
              </span>
              {hasDiscount && <span className="text-sm text-gray-500 line-through">${product.price.toFixed(2)}</span>}
            </div>
            {hasDiscount && product.savings && (
              <p className="text-sm text-green-600 font-medium">Save ${product.savings.toFixed(2)}</p>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <Button onClick={handleAddToCart} disabled={!product.in_stock || loading} loading={loading} className="w-full">
          <ShoppingCart className="h-4 w-4 mr-2" />
          {product.in_stock ? "Add to Cart" : "Out of Stock"}
        </Button>
      </div>
    </div>
  )
}
