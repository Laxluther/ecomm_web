import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Package, Leaf, Coffee } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export function BundleSection() {
  return (
    <section className="py-16 bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Experience the Power of Nature</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have transformed their daily routine
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Bundle Card 1 */}
          <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="aspect-square relative">
              <Image src="/placeholder.svg?height=300&width=300" alt="Honey Bundle" fill className="object-cover" />
            </div>
            <CardContent className="p-6">
              <div className="flex items-center mb-3">
                <Leaf className="h-5 w-5 text-amber-600 mr-2" />
                <h3 className="font-semibold text-lg">Honey Collection</h3>
              </div>
              <p className="text-gray-600 mb-4">Our premium honey selection sourced from pristine farms.</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/shop?category=1">
                  Explore <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Bundle Card 2 */}
          <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="aspect-square relative">
              <Image src="/placeholder.svg?height=300&width=300" alt="Coffee Bundle" fill className="object-cover" />
            </div>
            <CardContent className="p-6">
              <div className="flex items-center mb-3">
                <Coffee className="h-5 w-5 text-amber-600 mr-2" />
                <h3 className="font-semibold text-lg">Coffee Selection</h3>
              </div>
              <p className="text-gray-600 mb-4">Premium coffee beans for the perfect morning ritual.</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/shop?category=2">
                  Explore <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Bundle Card 3 */}
          <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="aspect-square relative">
              <Image src="/placeholder.svg?height=300&width=300" alt="Custom Bundle" fill className="object-cover" />
            </div>
            <CardContent className="p-6">
              <div className="flex items-center mb-3">
                <Package className="h-5 w-5 text-amber-600 mr-2" />
                <h3 className="font-semibold text-lg">Custom Bundle</h3>
              </div>
              <p className="text-gray-600 mb-4">Create your perfect combination of our premium products.</p>
              <Button asChild className="w-full bg-amber-700 hover:bg-amber-800">
                <Link href="/shop">
                  Build Your Bundle <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 flex justify-center">
          <div className="bg-amber-50 p-6 rounded-lg max-w-3xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-amber-700" />
              </div>
              <div>
                <h3 className="font-semibold">Free Shipping</h3>
                <p className="text-sm text-gray-600">For orders over ₹500</p>
              </div>
            </div>
            <div className="h-12 w-px bg-amber-200 hidden md:block"></div>
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-full">
                <svg className="h-6 w-6 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">60-day Money Back</h3>
                <p className="text-sm text-gray-600">Satisfaction guaranteed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
