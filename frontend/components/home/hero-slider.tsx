"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronLeft, ChevronRight, Leaf } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Slide {
  image: string
  title: string
  subtitle: string
  cta: string
  link: string
}

export function HeroSlider() {
  const slides: Slide[] = [
    {
      image: "/images/hero-banner-1.png",
      title: "Pure farm Treasures",
      subtitle: "Discover nature's finest honey, coffee, nuts and seeds sourced directly from pristine farms.",
      cta: "Explore Collection",
      link: "/shop",
    },
    {
      image: "/images/hero-banner-2.png",
      title: "From farm to Your Table",
      subtitle: "Experience the authentic taste of nature with our premium organic products.",
      cta: "Shop Now",
      link: "/shop",
    },
  ]

  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative h-[600px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <div className="relative h-full w-full">
            <Image
              src={slides[currentSlide].image || "/placeholder.svg"}
              alt={slides[currentSlide].title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />

            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-4">
                <div className="max-w-lg">
                  <div className="bg-white/95 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-emerald-100">
                    <div className="flex items-center mb-4">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-5 h-5 text-emerald-500 fill-current" viewBox="0 0 24 24">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-700">100,000+ Happy Customers</span>
                    </div>
                    <div className="flex items-center mb-4">
                      <Leaf className="h-6 w-6 text-emerald-600 mr-2" />
                      <span className="text-emerald-700 font-medium">100% Natural & Organic</span>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">{slides[currentSlide].title}</h1>
                    <p className="text-lg text-gray-700 mb-6">{slides[currentSlide].subtitle}</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button asChild size="lg" className="bg-emerald-700 hover:bg-emerald-800">
                        <Link href={slides[currentSlide].link}>
                          {slides[currentSlide].cta} <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                      >
                        <Link href="/shop">View All Products</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg z-10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6 text-gray-800" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg z-10"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6 text-gray-800" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full ${
              currentSlide === index ? "bg-white" : "bg-white/50"
            } transition-all duration-300`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
