"use client"

import Link from "next/link"
import { Button } from "@/components/ui/Button"

export function HeroSection() {
  return (
    <section className="hero-section py-16 lg:py-24">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center px-4 py-2 bg-amber-100 border border-amber-300 rounded-full text-amber-800 text-sm font-medium">
              *INCLUDES HOMEBREW SUBSCRIPTIONS*
            </div>

            <div className="space-y-6">
              <h1 className="section-title text-left mb-4">FATHER'S DAY SALE</h1>
              <div className="space-y-2">
                <p className="text-4xl lg:text-5xl font-heading font-black text-amber-900">15% OFF SITE-WIDE</p>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-heading font-bold text-amber-800">CODE:</span>
                  <span className="inline-flex items-center px-4 py-2 bg-amber-400 text-amber-900 font-black text-xl rounded-lg">
                    DRINKS4DAD
                  </span>
                </div>
                <p className="text-amber-700 font-medium">(SALE ENDS THURSDAY JUNE 5)</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/products">
                <Button size="lg" className="w-full sm:w-auto">
                  Shop Brewing Kits
                </Button>
              </Link>
              <Link href="/deals">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  View All Deals
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Content - Product Showcase */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="product-card p-4">
                  <img
                    src="/placeholder.svg?height=200&width=200"
                    alt="Beer Recipe Kit"
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                  <h3 className="font-heading font-bold text-amber-900 mb-1">Beer Recipe Kit</h3>
                  <p className="text-amber-700 text-sm">Complete brewing kit</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-amber-900">$49.99</span>
                    <span className="text-sm text-amber-600 line-through">$59.99</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mt-8">
                <div className="product-card p-4">
                  <img
                    src="/placeholder.svg?height=200&width=200"
                    alt="Deluxe Bottling Kit"
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                  <h3 className="font-heading font-bold text-amber-900 mb-1">Deluxe Bottling Kit</h3>
                  <p className="text-amber-700 text-sm">Professional bottling</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-amber-900">$89.99</span>
                    <span className="text-sm text-amber-600 line-through">$109.99</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-amber-400 rounded-full opacity-20"></div>
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-amber-600 rounded-full opacity-20"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
