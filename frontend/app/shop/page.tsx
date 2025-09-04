"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams, useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ProductGrid } from "@/components/product/product-grid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Filter, X } from "lucide-react"
import { productsAPI, categoriesAPI } from "@/lib/api"

export default function ShopPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    search: searchParams.get("search") || "",
    sortBy: searchParams.get("sort") || "created_at",
    page: 1,
    perPage: 12,
  })

  // FIX: Products query with better error handling
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["products", filters.category, filters.search, filters.sortBy, filters.page, filters.perPage],
    queryFn: async () => {
      const params: any = {
        page: filters.page,
        per_page: filters.perPage,
        sort_by: filters.sortBy,
      }
      
      if (filters.category) params.category_id = filters.category
      if (filters.search) params.search = filters.search

      console.log("Products API params:", params) // Debug log
      const response = await productsAPI.getAll(params)
      console.log("Products API response:", response) // Debug log
      return response
    },
    retry: 3,
    retryDelay: 1000,
    enabled: true, // Always enabled
  })

  // FIX: Categories query with consistent data handling
  const { 
    data: categoriesData, 
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories 
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      console.log("Fetching categories...") // Debug log
      const response = await categoriesAPI.getAll()
      console.log("Categories API response:", response) // Debug log
      return response
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  })

  const handleFilterChange = (key: string, value: string | number) => {
    console.log(`Filter change: ${key} = ${value}`) // Debug log
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
  }

  const clearFilters = () => {
    console.log("Clearing filters") // Debug log
    setFilters({
      category: "",
      search: "",
      sortBy: "created_at",
      page: 1,
      perPage: 12,
    })
  }

  // FIX: URL synchronization with better handling
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.category) params.set("category", filters.category)
    if (filters.search) params.set("search", filters.search)
    if (filters.sortBy !== "created_at") params.set("sort", filters.sortBy)
    if (filters.page > 1) params.set("page", filters.page.toString())
    
    const newUrl = `/shop${params.toString() ? `?${params.toString()}` : ""}`
    router.replace(newUrl, { scroll: false })
  }, [filters, router])

  const activeFiltersCount = [filters.category, filters.search].filter(Boolean).length

  // FIX: Safe data extraction with proper null checks
  const products = productsData?.products || []
  const categories = categoriesData?.categories || []
  const pagination = productsData?.pagination || null
  const totalProducts = pagination?.total || products.length

  console.log("Render state:", { 
    productsLoading, 
    categoriesLoading, 
    productsCount: products.length, 
    categoriesCount: categories.length,
    productsError: productsError?.message,
    categoriesError: categoriesError?.message
  }) // Debug log

  // Error handling for products
  if (productsError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 pt-32 pb-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Products</h1>
            <p className="text-gray-600 mb-4">
              We're having trouble connecting to our servers.
              Please check if your backend is running on http://localhost:5000
            </p>
            <div className="space-x-4">
              <Button onClick={() => refetchProducts()}>Try Again</Button>
              <Button onClick={() => window.location.reload()} variant="outline">Refresh Page</Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 pt-32 pb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                    {activeFiltersCount > 0 && <Badge variant="secondary">{activeFiltersCount}</Badge>}
                  </CardTitle>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div>
                  <Label htmlFor="search">Search Products</Label>
                  <div className="relative mt-2">
                    <Input
                      id="search"
                      type="text"
                      placeholder="Search..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                      className="pr-10"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <Label>Categories</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="all-categories"
                        checked={!filters.category}
                        onCheckedChange={() => handleFilterChange("category", "")}
                      />
                      <Label htmlFor="all-categories" className="text-sm">
                        All Categories
                      </Label>
                    </div>
                    
                    {/* FIX: Better categories loading and error handling */}
                    {categoriesError ? (
                      <div className="text-center py-4">
                        <p className="text-red-600 text-sm mb-2">Failed to load categories</p>
                        <Button size="sm" variant="outline" onClick={() => refetchCategories()}>
                          Retry
                        </Button>
                      </div>
                    ) : categoriesLoading ? (
                      <div className="space-y-2">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="h-6 bg-gray-200 rounded animate-pulse"></div>
                        ))}
                      </div>
                    ) : categories.length > 0 ? (
                      categories.map((category: any) => (
                        <div key={category.category_id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category.category_id}`}
                            checked={filters.category === category.category_id.toString()}
                            onCheckedChange={() =>
                              handleFilterChange(
                                "category",
                                filters.category === category.category_id.toString()
                                  ? ""
                                  : category.category_id.toString(),
                              )
                            }
                          />
                          <Label htmlFor={`category-${category.category_id}`} className="text-sm">
                            {category.category_name} {category.product_count && `(${category.product_count})`}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500 text-sm">No categories available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <Label htmlFor="sort">Sort By</Label>
                  <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Newest First</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="price_low">Price: Low to High</SelectItem>
                      <SelectItem value="price_high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="lg:w-3/4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {filters.category && categories.length > 0
                    ? categories.find((c: any) => c.category_id.toString() === filters.category)?.category_name ||
                      "Products"
                    : "All Products"}
                </h1>
                {products.length > 0 && (
                  <p className="text-gray-600 mt-1">
                    Showing {products.length} {totalProducts > products.length ? `of ${totalProducts}` : ""} products
                  </p>
                )}
              </div>
            </div>

            {productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
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
            ) : products.length > 0 ? (
              <>
                <ProductGrid products={products} />

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex justify-center mt-8 space-x-2">
                    {[...Array(pagination.pages)].map((_, i) => (
                      <Button
                        key={i + 1}
                        variant={filters.page === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFilterChange("page", i + 1)}
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  {filters.search || filters.category
                    ? "Try adjusting your filters or search terms"
                    : "No products are currently available"}
                </p>
                {(filters.search || filters.category) && (
                  <Button onClick={clearFilters} variant="outline">
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}