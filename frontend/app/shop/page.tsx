"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Filter, Grid, List, Star, Heart, ShoppingCart } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { useWishlist } from "@/contexts/WishlistContext"
import { useToast } from "@/contexts/ToastContext"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/Button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

interface Product {
  product_id: number
  product_name: string
  price: number
  discount_price: number
  primary_image: string
  average_rating: number
  total_reviews: number
  savings: number
  savings_percentage: number
  in_stock: boolean
  category_name: string
  brand?: string
  description: string
}

interface Category {
  category_id: number
  category_name: string
  product_count: number
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("featured")
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 10000 })
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { showToast } = useToast()

  useEffect(() => {
    loadData()
  }, [selectedCategory, sortBy, priceRange, currentPage])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load categories
      const categoriesResponse = await api.getCategories()
      if (categoriesResponse.data?.categories) {
        setCategories(categoriesResponse.data.categories)
      }

      // Load products with filters
      const params: any = {
        page: currentPage,
        per_page: 12,
      }

      if (selectedCategory) params.category = selectedCategory
      if (priceRange.min > 0) params.min_price = priceRange.min
      if (priceRange.max < 10000) params.max_price = priceRange.max

      if (sortBy !== "featured") {
        if (sortBy === "price-low") {
          params.sort_by = "price"
          params.sort_order = "asc"
        } else if (sortBy === "price-high") {
          params.sort_by = "price"
          params.sort_order = "desc"
        } else if (sortBy === "rating") {
          params.sort_by = "rating"
          params.sort_order = "desc"
        } else if (sortBy === "newest") {
          params.sort_by = "created_at"
          params.sort_order = "desc"
        }
      }

      const productsResponse = await api.getProducts(params)
      if (productsResponse.data?.products) {
        setProducts(productsResponse.data.products)
        if (productsResponse.data.pagination) {
          setTotalPages(productsResponse.data.pagination.pages)
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error)
      showToast("Failed to load products", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart({
        product_id: product.product_id,
        product_name: product.product_name,
        price: product.discount_price,
        quantity: 1,
        image_url: product.primary_image,
      })
      showToast("Added to cart!", "success")
    } catch (error) {
      showToast("Failed to add to cart", "error")
    }
  }

  const handleToggleWishlist = (productId: number) => {
    if (isInWishlist(productId)) {
      removeFromWishlist(productId)
      showToast("Removed from wishlist", "info")
    } else {
      addToWishlist(productId)
      showToast("Added to wishlist", "success")
    }
  }

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === "number" ? price : Number.parseFloat(price || "0")
    return numPrice.toFixed(2)
  }

  if (loading) {
    return (
      <div className="container py-16 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container py-12">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-green-800 mb-2">Shop All Products</h1>
          <p className="text-green-700">Discover our complete collection of natural wellness products</p>
        </div>

        <div className="flex items-center gap-4 mt-4 lg:mt-0">
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 ${viewMode === "grid" ? "bg-green-600 text-white" : "text-gray-600"}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 ${viewMode === "list" ? "bg-green-600 text-white" : "text-gray-600"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className={`lg:w-64 ${showFilters ? "block" : "hidden lg:block"}`}>
          <div className="bg-white rounded-lg shadow-sm border border-green-100 p-6 sticky top-4">
            <h3 className="text-lg font-heading font-bold text-green-800 mb-4">Filters</h3>

            {/* Categories */}
            <div className="mb-6">
              <h4 className="font-medium text-green-800 mb-3">Categories</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    value=""
                    checked={selectedCategory === ""}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="mr-2 text-green-600"
                  />
                  <span className="text-sm text-green-700">All Products</span>
                </label>
                {categories.map((category) => (
                  <label key={category.category_id} className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value={category.category_id}
                      checked={selectedCategory === category.category_id.toString()}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="mr-2 text-green-600"
                    />
                    <span className="text-sm text-green-700">
                      {category.category_name} ({category.product_count})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <h4 className="font-medium text-green-800 mb-3">Price Range</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange((prev) => ({ ...prev, min: Number(e.target.value) || 0 }))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange((prev) => ({ ...prev, max: Number(e.target.value) || 10000 }))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCategory("")
                setPriceRange({ min: 0, max: 10000 })
                setCurrentPage(1)
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="mb-4 text-sm text-green-700">Showing {products.length} products</div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No products found matching your criteria.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategory("")
                  setPriceRange({ min: 0, max: 10000 })
                  setCurrentPage(1)
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div
                className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}
              >
                {products.map((product) => (
                  <ProductCard
                    key={product.product_id}
                    product={product}
                    viewMode={viewMode}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                    isInWishlist={isInWishlist(product.product_id)}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center space-x-2 mt-8">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-4 py-2 rounded-lg ${
                        currentPage === i + 1
                          ? "bg-green-600 text-white"
                          : "bg-white text-green-600 border border-green-200 hover:bg-green-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface ProductCardProps {
  product: Product
  viewMode: "grid" | "list"
  onAddToCart: (product: Product) => void
  onToggleWishlist: (productId: number) => void
  isInWishlist: boolean
  formatPrice: (price: number | string) => string
}

function ProductCard({
  product,
  viewMode,
  onAddToCart,
  onToggleWishlist,
  isInWishlist,
  formatPrice,
}: ProductCardProps) {
  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-green-100 overflow-hidden flex">
        <div className="w-48 h-48 relative">
          <Image
            src={product.primary_image || "/placeholder.svg"}
            alt={product.product_name}
            fill
            className="object-cover"
          />
          {product.savings_percentage > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
              {product.savings_percentage}% OFF
            </div>
          )}
        </div>
        <div className="flex-1 p-6">
          <div className="flex justify-between items-start mb-2">
            <Link href={`/shop/${product.product_id}`}>
              <h3 className="text-lg font-medium text-green-800 hover:text-green-600 transition-colors">
                {product.product_name}
              </h3>
            </Link>
            <button onClick={() => onToggleWishlist(product.product_id)} className="p-1 hover:bg-gray-100 rounded">
              <Heart className={`h-5 w-5 ${isInWishlist ? "text-red-500 fill-current" : "text-gray-400"}`} />
            </button>
          </div>
          <p className="text-green-600 text-sm mb-2">{product.brand}</p>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.average_rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">({product.total_reviews})</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-green-800">₹{formatPrice(product.discount_price)}</span>
              {product.discount_price < product.price && (
                <span className="ml-2 text-sm text-gray-500 line-through">₹{formatPrice(product.price)}</span>
              )}
            </div>
            <Button onClick={() => onAddToCart(product)} disabled={!product.in_stock}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              {product.in_stock ? "Add to Cart" : "Out of Stock"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-green-100 overflow-hidden group hover:shadow-md transition-shadow">
      <div className="relative aspect-square">
        <Image
          src={product.primary_image || "/placeholder.svg"}
          alt={product.product_name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.savings_percentage > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
            {product.savings_percentage}% OFF
          </div>
        )}
        <button
          onClick={() => onToggleWishlist(product.product_id)}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
        >
          <Heart className={`h-4 w-4 ${isInWishlist ? "text-red-500 fill-current" : "text-gray-400"}`} />
        </button>
      </div>
      <div className="p-4">
        <Link href={`/shop/${product.product_id}`}>
          <h3 className="font-medium text-green-800 mb-1 hover:text-green-600 transition-colors line-clamp-2">
            {product.product_name}
          </h3>
        </Link>
        <p className="text-green-600 text-sm mb-2">{product.brand}</p>
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < Math.floor(product.average_rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="ml-1 text-xs text-gray-600">({product.total_reviews})</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-lg font-bold text-green-800">₹{formatPrice(product.discount_price)}</span>
            {product.discount_price < product.price && (
              <span className="ml-1 text-sm text-gray-500 line-through">₹{formatPrice(product.price)}</span>
            )}
          </div>
          {product.savings > 0 && (
            <span className="text-xs text-green-600 font-medium">Save ₹{formatPrice(product.savings)}</span>
          )}
        </div>
        <Button onClick={() => onAddToCart(product)} disabled={!product.in_stock} className="w-full" size="sm">
          <ShoppingCart className="h-4 w-4 mr-2" />
          {product.in_stock ? "Add to Cart" : "Out of Stock"}
        </Button>
      </div>
    </div>
  )
}
