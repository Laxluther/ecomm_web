"use client"

import { useQuery } from "@tanstack/react-query"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ProductGrid } from "@/components/product/product-grid"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowRight, Truck, Shield, Headphones, Gift, Leaf, Coffee, Nut, Wheat } from "lucide-react"
import api from "@/lib/api"
import { HeroSlider } from "@/components/home/hero-slider"

export function HomePage() {
  const { data: featuredProducts, isLoading: featuredLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const response = await api.get("/products/featured")
      return response.data.products
    },
  })

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get("/categories")
      return response.data.categories
    },
  })

  const getCategoryIcon = (categoryName: string) => {
    if (categoryName.toLowerCase().includes("honey")) return Leaf
    if (categoryName.toLowerCase().includes("coffee")) return Coffee
    if (categoryName.toLowerCase().includes("nuts")) return Nut
    if (categoryName.toLowerCase().includes("seeds")) return Wheat
    return Leaf
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Slider */}
      <HeroSlider />

      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
            <p className="text-xl text-gray-600">Explore our premium natural products</p>
          </div>

          {categoriesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="w-full h-32 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories?.map((category: any) => {
                const IconComponent = getCategoryIcon(category.category_name)
                return (
                  <Link key={category.category_id} href={`/shop?category=${category.category_id}`}>
                    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 hover:border-emerald-200">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-200 transition-colors">
                          <IconComponent className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-emerald-700 transition-colors">
                          {category.category_name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">{category.description}</p>
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                          {category.product_count} products
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

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
              <p className="text-gray-600">Customer support anytime</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="h-8 w-8 text-emerald-700" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Referral Rewards</h3>
              <p className="text-gray-600">Earn rewards for every referral</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-xl text-gray-600">Handpicked premium products just for you</p>
          </div>

          {featuredLoading ? (
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
          ) : (
            <ProductGrid products={featuredProducts || []} />
          )}

          <div className="text-center mt-12">
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
            >
              <Link href="/shop">
                View All Products <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-emerald-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Join Our farm Community</h2>
            <p className="mb-6">
              Subscribe to our newsletter and receive exclusive offers, early access to new products, and wellness tips.
            </p>
            <form className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                required
              />
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 px-8">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
