// COMPLETE REPLACEMENT for frontend/app/wishlist/page.tsx

"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, ShoppingCart, Trash2, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useCartStore } from "@/lib/store"
import { wishlistAPI, cartAPI } from "@/lib/api"
import Link from "next/link"
import Image from "next/image"
import toast from "react-hot-toast"

interface WishlistItem {
  product_id: number
  product_name?: string
  price?: any
  discount_price?: any
  primary_image?: string
  in_stock?: boolean
  brand?: string
}

export default function WishlistPage() {
  const { isAuthenticated } = useAuth()
  const { addItem } = useCartStore()
  const queryClient = useQueryClient()

  // SAFE Helper function to format currency
  const formatCurrency = (value: any): string => {
    try {
      const num = parseFloat(String(value || 0))
      if (isNaN(num)) return "₹0.00"
      return `₹${num.toFixed(2)}`
    } catch (error) {
      return "₹0.00"
    }
  }

  // SAFE Helper to get numeric value
  const getNumericValue = (value: any): number => {
    try {
      const num = parseFloat(String(value || 0))
      return isNaN(num) ? 0 : num
    } catch (error) {
      return 0
    }
  }

  // Fetch real wishlist data from API
  const { data: wishlistData, isLoading, error, refetch } = useQuery({
    queryKey: ["user-wishlist"],
    queryFn: async () => {
      const response = await wishlistAPI.get()
      return response
    },
    enabled: isAuthenticated,
    retry: 2,
    staleTime: 30000, // Cache for 30 seconds
  })

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: number) => {
      await wishlistAPI.remove(productId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-wishlist"] })
      toast.success("Removed from wishlist")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to remove from wishlist")
    },
  })

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (productId: number) => {
      await cartAPI.add(productId, 1)
    },
    onSuccess: (_, productId) => {
      // Update local cart store
      const item = wishlistItems?.find(item => item.product_id === productId)
      if (item) {
        const price = getNumericValue(item.price) || 0
        const discountPrice = getNumericValue(item.discount_price) || price
        addItem({
          product_id: item.product_id,
          product_name: item.product_name || 'Product',
          price: price,
          discount_price: discountPrice,
          quantity: 1,
          image_url: item.primary_image || '/placeholder.svg'
        })
      }
      toast.success("Added to cart!")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add to cart")
    },
  })

  const wishlistItems: WishlistItem[] = wishlistData?.wishlist_items || []

  const handleRemoveFromWishlist = (productId: number) => {
    removeFromWishlistMutation.mutate(productId)
  }

  const handleAddToCart = (productId: number, item: WishlistItem) => {
    if (item.in_stock === false) {
      toast.error("Product is out of stock")
      return
    }
    addToCartMutation.mutate(productId)
  }

  // SAFE calculation of savings
  const calculateSavings = (price: any, discountPrice: any): string => {
    const originalPrice = getNumericValue(price)
    const salePrice = getNumericValue(discountPrice)
    
    if (originalPrice > 0 && salePrice > 0 && originalPrice > salePrice) {
      const savings = originalPrice - salePrice
      return formatCurrency(savings)
    }
    return formatCurrency(0)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
            <p className="text-gray-600 mb-8">You need to login to view your wishlist</p>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          {error && (
            <Button onClick={() => refetch()} variant="outline">
              Retry
            </Button>
          )}
        </div>

        {isLoading ? (
          // Loading state
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-0">
                  <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          // Error state
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Wishlist</h2>
                <p className="text-gray-600 mb-4">There was an error loading your wishlist</p>
                <Button onClick={() => refetch()}>Try Again</Button>
              </div>
            </CardContent>
          </Card>
        ) : wishlistItems.length === 0 ? (
          // Empty state
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
                <p className="text-gray-600 mb-8">
                  Save items you love for later. Start browsing and add products to your wishlist!
                </p>
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                  <Link href="/shop">Browse Products</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Wishlist items
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => {
              const hasDiscount = getNumericValue(item.discount_price) > 0 && 
                                 getNumericValue(item.price) > getNumericValue(item.discount_price)
              const displayPrice = hasDiscount ? item.discount_price : item.price
              
              return (
                <Card key={item.product_id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    {/* Product Image */}
                    <div className="relative aspect-square overflow-hidden rounded-t-lg">
                      <Image
                        src={item.primary_image || "/placeholder.svg?height=300&width=300"}
                        alt={item.product_name || "Product"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      <button
                        onClick={() => handleRemoveFromWishlist(item.product_id)}
                        disabled={removeFromWishlistMutation.isPending}
                        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                      {item.in_stock === false && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white font-semibold">Out of Stock</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <div className="mb-2">
                        <p className="text-sm text-gray-600">{item.brand || 'Unknown Brand'}</p>
                        <Link 
                          href={`/product/${item.product_id}`}
                          className="font-medium text-gray-900 hover:text-emerald-600 transition-colors line-clamp-2"
                        >
                          {item.product_name || 'Product Name'}
                        </Link>
                      </div>

                      {/* Price - COMPLETELY SAFE */}
                      <div className="mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-emerald-600">
                            {formatCurrency(displayPrice)}
                          </span>
                          {hasDiscount && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatCurrency(item.price)}
                            </span>
                          )}
                        </div>
                        {hasDiscount && (
                          <p className="text-sm text-green-600">
                            Save {calculateSavings(item.price, item.discount_price)}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        <Button
                          onClick={() => handleAddToCart(item.product_id, item)}
                          disabled={item.in_stock === false || addToCartMutation.isPending}
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {item.in_stock === false ? "Out of Stock" : "Add to Cart"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="w-full"
                        >
                          <Link href={`/product/${item.product_id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Continue Shopping */}
        {wishlistItems.length > 0 && (
          <div className="mt-12 text-center">
            <Button variant="outline" asChild className="px-8">
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}