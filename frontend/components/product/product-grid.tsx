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
  stock_quantity?: number  // Added stock_quantity
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

    // ENHANCED: Check stock before adding to cart
    if (!product.in_stock || (product.stock_quantity && product.stock_quantity <= 0)) {
      toast.error("This product is currently out of stock")
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
    } catch (error: any) {
      console.error("Error adding item to cart:", error)
      
      // ENHANCED: Better error handling for stock issues
      if (error.response?.data?.error?.includes('out of stock')) {
        toast.error("This product is currently out of stock")
      } else if (error.response?.data?.error?.includes('insufficient stock')) {
        toast.error("Insufficient stock available")
      } else {
        toast.error("Failed to add item to cart")
      }
    }
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📦</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
          <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
        </div>
      </div>
    )
  }

  // ENHANCED: Process products to ensure they have all required fields
  const processedProducts = products.map(product => ({
    ...product,
    // Ensure stock_quantity is available for proper stock display
    stock_quantity: product.stock_quantity || 0,
    // Ensure in_stock is properly calculated
    in_stock: product.in_stock && (product.stock_quantity || 0) > 0,
    // Ensure savings is calculated
    savings: product.savings || (
      product.price > product.discount_price 
        ? product.price - product.discount_price 
        : 0
    ),
    // Ensure brand and category_name have fallbacks
    brand: product.brand || 'Unknown Brand',
    category_name: product.category_name || '',
  }))

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {processedProducts.map((product) => (
        <ProductCard 
          key={product.product_id} 
          product={product} 
          onAddToCart={() => handleAddToCart(product)} 
        />
      ))}
    </div>
  )
}