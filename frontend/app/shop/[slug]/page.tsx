"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Star, Heart, ShoppingCart, Minus, Plus, Truck, Shield, RotateCcw } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { useWishlist } from "@/contexts/WishlistContext"
import { useToast } from "@/contexts/ToastContext"
import Button from "@/shared/ui/button/Button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

interface Product {
  product_id: number
  product_name: string
  price: number
  discount_price: number
  primary_image: string
  images: string[]
  average_rating: number
  total_reviews: number
  savings: number
  savings_percentage: number
  in_stock: boolean
  category_name: string
  brand?: string
  description: string
  features: string[]
  specifications: { [key: string]: string }
}

export default function ProductDetailPage() {
  const params = useParams()
  const productSlug = params.slug as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState("description")

  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { showToast } = useToast()

  useEffect(() => {
    loadProduct()
  }, [productSlug])

  const loadProduct = async () => {
    try {
      setLoading(true)
      // Mock product data - replace with actual API call
      const mockProduct: Product = {
        product_id: Number.parseInt(productSlug) || 1,
        product_name: "Premium Mushroom Complex",
        price: 2999,
        discount_price: 2499,
        primary_image: "/placeholder.svg?height=500&width=500",
        images: [
          "/placeholder.svg?height=500&width=500",
          "/placeholder.svg?height=500&width=500",
          "/placeholder.svg?height=500&width=500",
          "/placeholder.svg?height=500&width=500",
        ],
        average_rating: 4.8,
        total_reviews: 156,
        savings: 500,
        savings_percentage: 17,
        in_stock: true,
        category_name: "supplements",
        brand: "Laurium",
        description:
          "Our Premium Mushroom Complex is a powerful blend of seven medicinal mushrooms, carefully selected for their immune-supporting and vitality-enhancing properties.",
        features: [
          "Blend of 7 premium medicinal mushrooms",
          "Supports immune system function",
          "Enhances cognitive performance",
          "Boosts natural energy levels",
          "Organic and sustainably sourced",
          "Third-party tested for purity",
          "Vegan and gluten-free",
          "60 capsules per bottle",
        ],
        specifications: {
          "Serving Size": "2 capsules",
          "Servings Per Container": "30",
          "Mushroom Extract Blend": "1000mg",
          Storage: "Store in a cool, dry place",
          "Shelf Life": "2 years from manufacture date",
          Certifications: "Organic, Non-GMO, GMP Certified",
        },
      }

      setProduct(mockProduct)
    } catch (error) {
      console.error("Failed to load product:", error)
      showToast("Failed to load product", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!product) return

    try {
      await addToCart({
        product_id: product.product_id,
        product_name: product.product_name,
        price: product.discount_price,
        quantity: quantity,
        image_url: product.primary_image,
      })
      showToast(`Added ${quantity} item(s) to cart!`, "success")
    } catch (error) {
      showToast("Failed to add to cart", "error")
    }
  }

  const handleToggleWishlist = () => {
    if (!product) return

    if (isInWishlist(product.product_id)) {
      removeFromWishlist(product.product_id)
      showToast("Removed from wishlist", "info")
    } else {
      addToWishlist(product.product_id)
      showToast("Added to wishlist", "success")
    }
  }

  if (loading) {
    return (
      <div className="container py-16 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold text-green-800 mb-4">Product Not Found</h1>
        <p className="text-green-700 mb-8">The product you're looking for doesn't exist.</p>
        <Link href="/shop">
          <Button>Back to Shop</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container py-12">
      {/* Breadcrumbs */}
      <nav className="mb-8">
        <ol className="flex items-center space-x-2 text-sm text-green-600">
          <li>
            <Link href="/" className="hover:text-green-800">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/shop" className="hover:text-green-800">
              Shop
            </Link>
          </li>
          <li>/</li>
          <li className="text-green-800 font-medium">{product.product_name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        {/* Product Images */}
        <div>
          <div className="relative aspect-square mb-4 bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={product.images[selectedImage] || "/placeholder.svg"}
              alt={product.product_name}
              fill
              className="object-cover"
            />
            {product.savings_percentage > 0 && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded text-sm font-bold">
                {product.savings_percentage}% OFF
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 ${
                  selectedImage === index ? "border-green-600" : "border-transparent"
                }`}
              >
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`${product.product_name} ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <div className="mb-4">
            <p className="text-green-600 font-medium mb-2">{product.brand}</p>
            <h1 className="text-3xl font-heading font-bold text-green-800 mb-4">{product.product_name}</h1>

            <div className="flex items-center mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.average_rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="ml-2 text-green-700">
                {product.average_rating} ({product.total_reviews} reviews)
              </span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold text-green-800">₹{product.discount_price}</span>
              {product.discount_price < product.price && (
                <>
                  <span className="text-xl text-gray-500 line-through">₹{product.price}</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                    Save ₹{product.savings}
                  </span>
                </>
              )}
            </div>

            <p className="text-green-700 mb-6 leading-relaxed">{product.description}</p>
          </div>

          {/* Quantity and Add to Cart */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2 text-gray-600 hover:bg-gray-100">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-green-700">{product.in_stock ? "In Stock" : "Out of Stock"}</span>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleAddToCart}
                disabled={!product.in_stock}
                className="flex-1 flex items-center justify-center gap-2"
                size="lg"
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </Button>
              <Button
                variant="outline"
                onClick={handleToggleWishlist}
                className="flex items-center justify-center"
                size="lg"
              >
                <Heart className={`h-5 w-5 ${isInWishlist(product.product_id) ? "text-red-500 fill-current" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Truck className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800 text-sm">Free Shipping</p>
                <p className="text-green-600 text-xs">On orders above ₹2000</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800 text-sm">Quality Assured</p>
                <p className="text-green-600 text-xs">Third-party tested</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <RotateCcw className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800 text-sm">30-Day Returns</p>
                <p className="text-green-600 text-xs">Money-back guarantee</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-green-100 overflow-hidden">
        <div className="border-b border-green-100">
          <nav className="flex">
            {["description", "features", "specifications", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-medium capitalize ${
                  activeTab === tab
                    ? "text-green-800 border-b-2 border-green-600"
                    : "text-green-600 hover:text-green-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "description" && (
            <div>
              <h3 className="text-xl font-heading font-bold text-green-800 mb-4">Product Description</h3>
              <p className="text-green-700 leading-relaxed">{product.description}</p>
            </div>
          )}

          {activeTab === "features" && (
            <div>
              <h3 className="text-xl font-heading font-bold text-green-800 mb-4">Key Features</h3>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-green-700">
                    <span className="text-green-600 mt-1">•</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === "specifications" && (
            <div>
              <h3 className="text-xl font-heading font-bold text-green-800 mb-4">Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-green-100">
                    <span className="font-medium text-green-800">{key}:</span>
                    <span className="text-green-700">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div>
              <h3 className="text-xl font-heading font-bold text-green-800 mb-4">Customer Reviews</h3>
              <div className="text-center py-8 text-green-600">
                <p>Reviews feature coming soon!</p>
                <p className="text-sm mt-2">We're working on implementing customer reviews.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
