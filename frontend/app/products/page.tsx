"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Filter, Grid, List, Star, ShoppingCart, Heart, ChevronDown } from "lucide-react"
import { api } from "@/lib/api"
import { useCart } from "@/contexts/CartContext"
import { useWishlist } from "@/contexts/WishlistContext"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

interface Product {
  product_id: number
  product_name: string
  description: string
  price: number
  discount_price: number
  brand: string
  category_id: number
  category_name: string
  sku: string
  is_featured: boolean
  status: string
  primary_image: string
  images: Array<{
    image_id: number
    image_url: string
    alt_text: string
    is_primary: boolean
    sort_order: number
  }>
  stock_quantity: number
  in_stock: boolean
  average_rating: number
  total_reviews: number
  savings: number
  savings_percentage: number
  created_at: string
}

interface Category {
  category_id: number
  category_name: string
  description: string
  image_url: string
  parent_id: number | null
  sort_order: number
  status: string
  product_count: number
  created_at: string
}

interface FilterOptions {
  price_range: {
    min: number
    max: number
  }
  brands: Array<{
    brand: string
    product_count: number
  }>
  categories: Array<{
    category_id: number
    category_name: string
    product_count: number
  }>
  rating_options: Array<{
    value: number
    label: string
  }>
  sort_options: Array<{
    value: string
    label: string
  }>
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 12,
    total: 0,
    pages: 0,
  })

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000 })
  const [minRating, setMinRating] = useState<number>(0)
  const [sortBy, setSortBy] = useState<string>("relevance")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const searchParams = useSearchParams()
  const router = useRouter()
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  useEffect(() => {
    // Initialize filters from URL params
    const category = searchParams.get("category") || ""
    const search = searchParams.get("search") || ""
    const sort = searchParams.get("sort_by") || "relevance"
    const page = Number.parseInt(searchParams.get("page") || "1")

    setSelectedCategory(category)
    setSearchQuery(search)
    setSortBy(sort)
    setPagination((prev) => ({ ...prev, page }))

    loadInitialData()
  }, [searchParams])

  useEffect(() => {
    loadProducts()
  }, [selectedCategory, selectedBrands, priceRange, minRating, sortBy, searchQuery, pagination.page])

  const loadInitialData = async () => {
    try {
      const [categoriesRes, filterOptionsRes] = await Promise.all([api.getCategories(), api.getFilterOptions()])

      if (categoriesRes.data?.categories) {
        setCategories(categoriesRes.data.categories)
      }
      if (filterOptionsRes.data) {
        setFilterOptions(filterOptionsRes.data)
        setPriceRange({
          min: filterOptionsRes.data.price_range.min,
          max: filterOptionsRes.data.price_range.max,
        })
      }
    } catch (error) {
      console.error("Failed to load initial data:", error)
    }
  }

  const loadProducts = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: pagination.page,
        per_page: pagination.per_page,
        sort_by: sortBy,
      }

      if (selectedCategory) params.category = selectedCategory
      if (searchQuery) params.search = searchQuery
      if (priceRange.min > 0) params.min_price = priceRange.min
      if (priceRange.max < (filterOptions?.price_range.max || 1000)) params.max_price = priceRange.max

      const response = await api.getProducts(params)

      if (response.data) {
        setProducts(response.data.products || [])
        setPagination(response.data.pagination || pagination)
      }
    } catch (error) {
      console.error("Failed to load products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (productId: number) => {
    await addToCart(productId, 1)
  }

  const handleToggleWishlist = async (productId: number) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId)
    } else {
      await addToWishlist(productId)
    }
  }

  const handleFilterChange = useCallback(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
    updateURL()
  }, [selectedCategory, selectedBrands, priceRange, minRating, sortBy, searchQuery])

  const updateURL = () => {
    const params = new URLSearchParams()
    if (selectedCategory) params.set("category", selectedCategory)
    if (searchQuery) params.set("search", searchQuery)
    if (sortBy !== "relevance") params.set("sort_by", sortBy)
    if (pagination.page > 1) params.set("page", pagination.page.toString())

    const newURL = params.toString() ? `?${params.toString()}` : "/products"
    router.push(newURL, { scroll: false })
  }

  const clearFilters = () => {
    setSelectedCategory("")
    setSelectedBrands([])
    setPriceRange(filterOptions?.price_range || { min: 0, max: 1000 })
    setMinRating(0)
    setSortBy("relevance")
    setSearchQuery("")
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Products</h1>
            <p className="text-gray-600">
              {pagination.total > 0 ? `Showing ${pagination.total} products` : "No products found"}
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${viewMode === "grid" ? "bg-primary text-white" : "text-gray-600"}`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${viewMode === "list" ? "bg-primary text-white" : "text-gray-600"}`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {filterOptions?.sort_options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Filter Toggle (Mobile) */}
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="lg:hidden">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-64 ${showFilters ? "block" : "hidden lg:block"}`}>
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Filters</h3>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Categories</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value=""
                        checked={selectedCategory === ""}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="mr-2"
                      />
                      All Categories
                    </label>
                    {categories.map((category) => (
                      <label key={category.category_id} className="flex items-center">
                        <input
                          type="radio"
                          name="category"
                          value={category.category_id.toString()}
                          checked={selectedCategory === category.category_id.toString()}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="mr-2"
                        />
                        {category.category_name} ({category.product_count})
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Price Range</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={priceRange.min}
                        onChange={(e) =>
                          setPriceRange((prev) => ({ ...prev, min: Number.parseInt(e.target.value) || 0 }))
                        }
                        className="w-20"
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={priceRange.max}
                        onChange={(e) =>
                          setPriceRange((prev) => ({ ...prev, max: Number.parseInt(e.target.value) || 1000 }))
                        }
                        className="w-20"
                      />
                    </div>
                  </div>
                </div>

                {/* Brands */}
                {filterOptions?.brands && filterOptions.brands.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Brands</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {filterOptions.brands.map((brand) => (
                        <label key={brand.brand} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedBrands.includes(brand.brand)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBrands((prev) => [...prev, brand.brand])
                              } else {
                                setSelectedBrands((prev) => prev.filter((b) => b !== brand.brand))
                              }
                            }}
                            className="mr-2"
                          />
                          {brand.brand} ({brand.product_count})
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rating */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Minimum Rating</h4>
                  <div className="space-y-2">
                    {filterOptions?.rating_options.map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="rating"
                          value={option.value}
                          checked={minRating === option.value}
                          onChange={(e) => setMinRating(Number.parseInt(e.target.value))}
                          className="mr-2"
                        />
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < option.value ? "text-yellow-400 fill-current" : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm">{option.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid/List */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-4">No products found</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            ) : (
              <>
                <div
                  className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}
                >
                  {products.map((product) =>
                    viewMode === "grid" ? (
                      <ProductCard
                        key={product.product_id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        onToggleWishlist={handleToggleWishlist}
                        isInWishlist={isInWishlist(product.product_id)}
                      />
                    ) : (
                      <ProductListItem
                        key={product.product_id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        onToggleWishlist={handleToggleWishlist}
                        isInWishlist={isInWishlist(product.product_id)}
                      />
                    ),
                  )}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-center mt-12 space-x-2">
                    <Button
                      variant="outline"
                      disabled={pagination.page === 1}
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    >
                      Previous
                    </Button>
                    {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                      const page = i + 1
                      return (
                        <Button
                          key={page}
                          variant={pagination.page === page ? "primary" : "outline"}
                          onClick={() => setPagination((prev) => ({ ...prev, page }))}
                        >
                          {page}
                        </Button>
                      )
                    })}
                    <Button
                      variant="outline"
                      disabled={pagination.page === pagination.pages}
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface ProductCardProps {
  product: Product
  onAddToCart: (productId: number) => void
  onToggleWishlist: (productId: number) => void
  isInWishlist: boolean
}

function ProductCard({ product, onAddToCart, onToggleWishlist, isInWishlist }: ProductCardProps) {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-square">
        <Image
          src={product.primary_image || `/placeholder.svg?height=300&width=300`}
          alt={product.product_name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.savings_percentage > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
            {product.savings_percentage.toFixed(0)}% OFF
          </div>
        )}
        <button
          onClick={() => onToggleWishlist(product.product_id)}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
        >
          <Heart className={`h-5 w-5 ${isInWishlist ? "text-red-500 fill-current" : "text-gray-400"}`} />
        </button>
        {!product.in_stock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold">Out of Stock</span>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <Link href={`/products/${product.product_id}`}>
          <h3 className="font-semibold text-gray-900 mb-2 hover:text-primary transition-colors line-clamp-2">
            {product.product_name}
          </h3>
        </Link>
        <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm text-gray-600">
              {product.average_rating.toFixed(1)} ({product.total_reviews})
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-lg font-bold text-gray-900">${product.discount_price.toFixed(2)}</span>
            {product.discount_price < product.price && (
              <span className="ml-2 text-sm text-gray-500 line-through">${product.price.toFixed(2)}</span>
            )}
          </div>
          {product.savings > 0 && (
            <span className="text-sm text-green-600 font-medium">Save ${product.savings.toFixed(2)}</span>
          )}
        </div>
        <Button
          onClick={() => onAddToCart(product.product_id)}
          disabled={!product.in_stock}
          className="w-full"
          size="sm"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {product.in_stock ? "Add to Cart" : "Out of Stock"}
        </Button>
      </CardContent>
    </Card>
  )
}

function ProductListItem({ product, onAddToCart, onToggleWishlist, isInWishlist }: ProductCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex">
        <div className="relative w-48 h-48">
          <Image
            src={product.primary_image || `/placeholder.svg?height=200&width=200`}
            alt={product.product_name}
            fill
            className="object-cover"
          />
          {product.savings_percentage > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
              {product.savings_percentage.toFixed(0)}% OFF
            </div>
          )}
        </div>
        <div className="flex-1 p-6">
          <div className="flex justify-between items-start mb-2">
            <Link href={`/products/${product.product_id}`}>
              <h3 className="text-xl font-semibold text-gray-900 hover:text-primary transition-colors">
                {product.product_name}
              </h3>
            </Link>
            <button
              onClick={() => onToggleWishlist(product.product_id)}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <Heart className={`h-5 w-5 ${isInWishlist ? "text-red-500 fill-current" : "text-gray-400"}`} />
            </button>
          </div>
          <p className="text-gray-600 mb-2">{product.brand}</p>
          <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="ml-1 text-sm text-gray-600">
                {product.average_rating.toFixed(1)} ({product.total_reviews} reviews)
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-gray-900">${product.discount_price.toFixed(2)}</span>
              {product.discount_price < product.price && (
                <span className="ml-2 text-lg text-gray-500 line-through">${product.price.toFixed(2)}</span>
              )}
              {product.savings > 0 && (
                <span className="ml-2 text-green-600 font-medium">Save ${product.savings.toFixed(2)}</span>
              )}
            </div>
            <Button onClick={() => onAddToCart(product.product_id)} disabled={!product.in_stock} size="lg">
              <ShoppingCart className="mr-2 h-4 w-4" />
              {product.in_stock ? "Add to Cart" : "Out of Stock"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
