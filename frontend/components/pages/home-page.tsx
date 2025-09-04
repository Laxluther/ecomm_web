"use client"

import { useQuery } from "@tanstack/react-query"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ProductGrid } from "@/components/product/product-grid"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Truck, Shield, Headphones, Gift, Leaf, Coffee, Nut, Wheat } from "lucide-react"
import { productsAPI, categoriesAPI } from "@/lib/api"
import { HeroSlider } from "@/components/home/hero-slider"

export function HomePage() {
  const { data: featuredProducts, isLoading: featuredLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const response = await productsAPI.getFeatured()
      return response.products
    },
    retry: 3,
    retryDelay: 1000,
  })

  // FIX: Corrected categories query
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await categoriesAPI.getAll()
      console.log("Categories API Response:", response) // Debug log
      return response  // Return the full response object
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes - helps with random loading issues
  })

  const getCategoryIcon = (categoryName: string) => {
    if (categoryName.toLowerCase().includes("honey")) return Leaf
    if (categoryName.toLowerCase().includes("coffee")) return Coffee
    if (categoryName.toLowerCase().includes("nuts")) return Nut
    if (categoryName.toLowerCase().includes("seeds")) return Wheat
    return Leaf
  }

  // FIX: Proper data extraction with safety checks
  const categories = categoriesData?.categories || []

  // Debug log for categories
  console.log("Categories data:", categoriesData)
  console.log("Categories array:", categories)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header transparent />

      {/* Hero Slider */}
      <HeroSlider />

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
            <p className="text-xl text-gray-600">Explore our premium natural products</p>
          </div>

          {/* FIX: Better error handling and loading states */}
          {categoriesError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Unable to load categories</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : categoriesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* FIX: Improved safety checks and rendering */}
              {categories && Array.isArray(categories) && categories.length > 0 ? (
                categories.map((category: any) => {
                  const IconComponent = getCategoryIcon(category.category_name)
                  return (
                    <Link key={category.category_id} href={`/shop?category=${category.category_id}`}>
                      <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <CardContent className="p-6">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <IconComponent className="w-8 h-8 text-green-600" />
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {category.category_name}
                          </h3>
                          {category.description && (
                            <p className="text-sm text-gray-600">
                              {category.description}
                            </p>
                          )}
                          {category.product_count && (
                            <Badge variant="secondary" className="mt-2">
                              {category.product_count} products
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })
              ) : (
                // Better fallback when no categories are available
                <div className="col-span-full text-center py-8">
                  <div className="max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Leaf className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories Available</h3>
                    <p className="text-gray-600 mb-4">Categories are being updated. Please check back soon!</p>
                    <Button onClick={() => window.location.reload()}>Refresh Page</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
              <p className="text-xl text-gray-600">Handpicked favorites from our collection</p>
            </div>

            {featuredLoading ? (
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
            ) : (
              <>
                <ProductGrid products={featuredProducts} />
                <div className="text-center mt-8">
                  <Link href="/shop">
                    <Button size="lg" className="bg-green-700 hover:bg-green-800">
                      View All Products
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-16 bg-emerald-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-emerald-700" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Free Shipping</h3>
              <p className="text-gray-600">Free delivery on orders above ₹500</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-emerald-700" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Quality Assured</h3>
              <p className="text-gray-600">100% natural and premium quality</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="h-8 w-8 text-emerald-700" />
              </div>
              <h3 className="font-semibold text-lg mb-2">24/7 Support</h3>
              <p className="text-gray-600">Always here to help you</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="h-8 w-8 text-emerald-700" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Special Offers</h3>
              <p className="text-gray-600">Regular discounts and deals</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}