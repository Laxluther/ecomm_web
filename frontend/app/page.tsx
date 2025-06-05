import Link from "next/link"
import Image from "next/image"
import { Star, ArrowRight, Leaf, Shield, Truck } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/Button"
import { HeroSlider } from "@/components/sections/HeroSlider"
import { ClientInteractions } from "@/components/ClientInteractions"
import { NewsletterSection } from "@/components/sections/NewsletterSection"

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
  image?: string
}

// Server-side data fetching
async function getHomePageData() {
  try {
    // Fetch data on the server
    const [categoriesResponse, featuredResponse] = await Promise.allSettled([
      api.getCategories(),
      api.getFeaturedProducts(),
    ])

    const categories: Category[] = categoriesResponse.status === "fulfilled" ? categoriesResponse.value.data?.categories || [] : []
    const featuredProducts = featuredResponse.status === "fulfilled" ? featuredResponse.value.data?.products || [] : []

    return {
      categories,
      featuredProducts,
    }
  } catch (error) {
    console.error("Failed to load homepage data:", error)
    return {
      categories: [],
      featuredProducts: [],
    }
  }
}

export default async function HomePage() {
  // Data is fetched on the server before rendering
  const { categories, featuredProducts } = await getHomePageData()

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === "number" ? price : Number.parseFloat(price || "0")
    return numPrice.toFixed(2)
  }

  return (
    <div className="min-h-screen">
      {/* Hero Slider */}
      <HeroSlider />

      {/* All Categories Section - Server Rendered */}
      <section className="py-16 bg-green-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-green-800 mb-4">Shop by Category</h2>
            <p className="text-green-700 max-w-2xl mx-auto">
              Explore our complete collection of natural wellness products across all categories
            </p>
          </div>

          {categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((category) => (
                <Link
                  key={category.category_id}
                  href={`/shop?category=${category.category_id}`}
                  className="group bg-white rounded-lg shadow-sm border border-green-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square relative">
                    <Image
                      src={category.image || "/placeholder.svg?height=200&width=200"}
                      alt={category.category_name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="font-semibold text-green-800 mb-1 group-hover:text-green-600 transition-colors">
                      {category.category_name}
                    </h3>
                    <p className="text-green-600 text-sm">{category.product_count} products</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-heading font-bold text-green-800 mb-2">Categories Coming Soon</h3>
                <p className="text-green-700 mb-6">
                  We're preparing our amazing product categories for you. Check back soon!
                </p>
                <Link href="/shop">
                  <Button>Browse All Products</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section - Server Rendered */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-green-800 mb-4">Featured Products</h2>
            <p className="text-green-700 max-w-2xl mx-auto">
              Discover our handpicked selection of premium wellness products
            </p>
          </div>

          {featuredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProducts.map((product: Product) => (
                  <div
                    key={product.product_id}
                    className="bg-white rounded-lg shadow-sm border border-green-100 overflow-hidden group hover:shadow-md transition-shadow"
                  >
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
                      {/* Client-side interactions */}
                      <ClientInteractions productId={product.product_id} />
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
                                i < Math.floor(product.average_rating)
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-1 text-xs text-gray-600">({product.total_reviews})</span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-lg font-bold text-green-800">
                            ₹{formatPrice(product.discount_price)}
                          </span>
                          {product.discount_price < product.price && (
                            <span className="ml-1 text-sm text-gray-500 line-through">
                              ₹{formatPrice(product.price)}
                            </span>
                          )}
                        </div>
                        {product.savings > 0 && (
                          <span className="text-xs text-green-600 font-medium">
                            Save ₹{formatPrice(product.savings)}
                          </span>
                        )}
                      </div>
                      {/* Client-side add to cart */}
                      <ClientInteractions productId={product.product_id} product={product} showAddToCart />
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-12">
                <Link href="/shop">
                  <Button size="lg" variant="outline">
                    View All Products
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-heading font-bold text-green-800 mb-2">Featured Products Coming Soon</h3>
                <p className="text-green-700 mb-6">
                  We're curating our best products to feature here. Once you create the featured products API, they'll
                  appear automatically!
                </p>
                <Link href="/shop">
                  <Button>Explore All Products</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-green-50">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Leaf className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-heading font-bold text-green-800 mb-2">Natural Ingredients</h3>
              <p className="text-green-700">
                All our products are made with natural ingredients, sourced responsibly from trusted suppliers.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Truck className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-heading font-bold text-green-800 mb-2">Free Shipping</h3>
              <p className="text-green-700">
                Enjoy free shipping on all orders above ₹599. Fast delivery across India.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-heading font-bold text-green-800 mb-2">Satisfaction Guarantee</h3>
              <p className="text-green-700">
                Not satisfied with your purchase? Return within 30 days for a full refund.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section - Client Component */}
      <NewsletterSection />
    </div>
  )
}

// Generate metadata for SEO
export async function generateMetadata() {
  const { categories, featuredProducts } = await getHomePageData()

  return {
    title: "Premium Wellness Products | Natural Health Solutions",
    description: `Discover ${categories.length} categories of natural wellness products. Shop ${featuredProducts.length} featured items with free shipping across India.`,
    keywords: categories.map((cat) => cat.category_name).join(", "),
    openGraph: {
      title: "Premium Wellness Products | Natural Health Solutions",
      description: "Explore our complete collection of natural wellness products",
      images: featuredProducts.length > 0 ? [featuredProducts[0].primary_image] : [],
    },
  }
}
