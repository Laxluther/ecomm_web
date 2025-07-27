"use client"

import { Label } from "@/components/ui/label"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Star, Minus, Plus, Heart, Share2, Truck, Shield, RotateCcw } from "lucide-react"
import { useCartStore } from "@/lib/store"
import { useAuth } from "@/lib/auth"
import api from "@/lib/api"
import toast from "react-hot-toast"
const getNumericValue = (value: any): number => {
  try {
    const num = parseFloat(String(value || 0))
    return isNaN(num) ? 0 : num
  } catch (error) {
    return 0
  }
}

const formatCurrency = (value: any): string => {
  try {
    const num = getNumericValue(value)
    return `₹${num.toFixed(2)}`
  } catch (error) {
    return "₹0.00"
  }
}
export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const { addItem } = useCartStore()
  const { isAuthenticated } = useAuth()

  const { data: productData, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const response = await api.get(`/products/${productId}`)
      return response.data
    },
  })

  const product = productData?.product
  const images = productData?.images || []
  const reviews = productData?.reviews || []
  const rating = productData?.rating || { average: 0, total_reviews: 0 }

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart")
      return
    }

    if (!product) return

    try {
      await api.post("/user/cart/add", {
        product_id: product.product_id,
        quantity,
      })

      addItem({
        cart_id: Date.now(),
        product_id: product.product_id,
        product_name: product.product_name,
        quantity,
        price: product.price,
        discount_price: product.discount_price,
        image_url: images[0]?.image_url || "/placeholder.svg?height=300&width=300",
      })

      toast.success(`${quantity} item(s) added to cart!`)
    } catch (error) {
      toast.error("Failed to add item to cart")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
              <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600">The product you're looking for doesn't exist.</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const productPrice = getNumericValue(product.price)
const productDiscountPrice = getNumericValue(product.discount_price)
const discountPercentage = productPrice > 0 && productDiscountPrice > 0 
  ? Math.round(((productPrice - productDiscountPrice) / productPrice) * 100)
  : 0
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square relative overflow-hidden rounded-lg bg-white">
              <Image
                src={images[selectedImage]?.image_url || "/placeholder.svg?height=600&width=600"}
                alt={product.product_name}
                fill
                className="object-cover"
              />
              {discountPercentage > 0 && (
                <Badge className="absolute top-4 left-4 bg-red-500 hover:bg-red-600">{discountPercentage}% OFF</Badge>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image: any, index: number) => (
                  <button
                    key={image.image_id}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square relative overflow-hidden rounded border-2 ${
                      selectedImage === index ? "border-amber-600" : "border-gray-200"
                    }`}
                  >
                    <Image
                      src={image.image_url || "/placeholder.svg"}
                      alt={image.alt_text}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">{product.brand}</p>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.product_name}</h1>
              <p className="text-sm text-gray-500">SKU: {product.sku}</p>
            </div>

            {/* Rating */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(rating.average) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {rating.average > 0 ? `${rating.average}/5` : "No reviews yet"} ({rating.total_reviews} reviews)
              </span>
            </div>

            {/* Price */}
<div className="flex items-center space-x-4">
  <span className="text-3xl font-bold text-amber-600">
    ₹{getNumericValue(product.discount_price).toFixed(0)}
  </span>
  {getNumericValue(product.price) > getNumericValue(product.discount_price) && (
    <>
      <span className="text-xl text-gray-500 line-through">
        ₹{getNumericValue(product.price).toFixed(0)}
      </span>
      <Badge variant="destructive">
        {Math.round(((getNumericValue(product.price) - getNumericValue(product.discount_price)) / getNumericValue(product.price)) * 100)}% OFF
      </Badge>
    </>
  )}
</div>

            {/* Stock Status */}
            <div>
              {product.in_stock ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  In Stock
                </Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Product Details */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Product Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Weight:</span>
                  <span className="font-medium">{product.weight}kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Brand:</span>
                  <span className="font-medium">{product.brand}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="quantity" className="text-sm font-medium">
                  Quantity
                </Label>
                <div className="flex items-center space-x-3 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button onClick={handleAddToCart} disabled={!product.in_stock} className="flex-1" size="lg">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button variant="outline" size="lg">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Features */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Truck className="h-4 w-4 text-amber-600" />
                    <span>Free shipping on orders above ₹500</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-amber-600" />
                    <span>100% quality assured</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RotateCcw className="h-4 w-4 text-amber-600" />
                    <span>Easy returns</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.map((review: any) => (
                <Card key={review.review_id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{review.user_name}</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{review.created_at}</span>
                    </div>
                    <p className="text-gray-600">{review.comment}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
