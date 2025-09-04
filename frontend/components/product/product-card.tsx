"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, Star, Heart, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/lib/auth"
import api from "@/lib/api"
import toast from "react-hot-toast"

interface Product {
  product_id: number
  product_name: string
  price: number | string
  discount_price: number | string
  primary_image: string
  savings: number | string
  in_stock: boolean
  stock_quantity?: number  // Added stock_quantity
  category_name: string
  brand: string
}

interface ProductCardProps {
  product: Product
  onAddToCart: (quantity: number) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { isAuthenticated } = useAuth()
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [isWishlistLoading, setIsWishlistLoading] = useState(false)
  const [quantity, setQuantity] = useState(1)

  // Convert prices to numbers to ensure proper calculations
  const price = typeof product.price === "string" ? Number.parseFloat(product.price) : product.price
  const discountPrice =
    typeof product.discount_price === "string" ? Number.parseFloat(product.discount_price) : product.discount_price
  const savings = typeof product.savings === "string" ? Number.parseFloat(product.savings) : product.savings

  // ENHANCED: Better stock logic
  const stockQuantity = product.stock_quantity || 0
  const isInStock = product.in_stock && stockQuantity > 0
  const isLowStock = stockQuantity > 0 && stockQuantity <= 5
  
  // Calculate discount percentage safely
  const discountPercentage = price > 0 ? Math.round(((price - discountPrice) / price) * 100) : 0

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart")
      return
    }

    if (!isInStock) {
      toast.error("This product is currently out of stock")
      return
    }

    onAddToCart(quantity)
  }

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to wishlist")
      return
    }

    setIsWishlistLoading(true)
    try {
      if (isInWishlist) {
        await api.delete(`/wishlist/remove/${product.product_id}`)
        setIsInWishlist(false)
        toast.success("Removed from wishlist")
      } else {
        await api.post("/wishlist/add", { product_id: product.product_id })
        setIsInWishlist(true)
        toast.success("Added to wishlist")
      }
    } catch (error) {
      console.error("Wishlist error:", error)
      toast.error("Failed to update wishlist")
    } finally {
      setIsWishlistLoading(false)
    }
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 relative overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={product.primary_image || "/placeholder.svg?height=300&width=300"}
            alt={product.product_name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            disabled={isWishlistLoading}
            className={`absolute top-2 right-2 p-2 rounded-full shadow-md transition-all duration-200 ${
              isInWishlist
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-white text-gray-400 hover:text-red-500 hover:bg-red-50"
            } ${isWishlistLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-110"}`}
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`h-4 w-4 ${isInWishlist ? "fill-current" : ""}`} />
          </button>

          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
              {discountPercentage}% OFF
            </Badge>
          )}

          {/* ENHANCED: Stock Status Badges */}
          {!isInStock ? (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
              <Badge variant="destructive" className="text-white bg-red-600 text-base px-4 py-2">
                Out of Stock
              </Badge>
            </div>
          ) : isLowStock ? (
            <Badge variant="secondary" className="absolute bottom-2 left-2 bg-orange-500 text-white">
              Only {stockQuantity} left!
            </Badge>
          ) : null}
        </div>

        <div className="p-4">
          <div className="mb-2">
            <p className="text-sm text-gray-500">{product.brand}</p>
            <Link href={`/product/${product.product_id}`}>
              <h3 className="font-semibold text-lg hover:text-emerald-600 transition-colors line-clamp-2">
                {product.product_name}
              </h3>
            </Link>
            <p className="text-sm text-gray-500">{product.category_name}</p>
          </div>

          <div className="flex items-center space-x-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-gray-200 text-gray-200" />
            ))}
            <span className="text-sm text-gray-500 ml-2">(0 reviews)</span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-emerald-600">₹{discountPrice.toFixed(0)}</span>
              {price > discountPrice && <span className="text-sm text-gray-500 line-through">₹{price.toFixed(0)}</span>}
            </div>
            {savings > 0 && <span className="text-sm text-green-600 font-medium">Save ₹{savings.toFixed(0)}</span>}
          </div>

          {/* ENHANCED: Stock Information Display */}
          {isInStock && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Stock:</span>
                <span className={`font-medium ${isLowStock ? 'text-orange-600' : 'text-green-600'}`}>
                  {stockQuantity > 10 ? 'In Stock' : `${stockQuantity} left`}
                </span>
              </div>
            </div>
          )}

          {/* Quantity Selector - Only show when in stock */}
          {isInStock && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Quantity:</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-12 text-center font-medium text-sm">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.min(stockQuantity, quantity + 1))}
                  disabled={quantity >= stockQuantity}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <Button
            onClick={handleAddToCart}
            disabled={!isInStock}
            className={`w-full ${
              isInStock 
                ? 'bg-emerald-600 hover:bg-emerald-700' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            size="sm"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isInStock ? `Add ${quantity} to Cart` : "Out of Stock"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}