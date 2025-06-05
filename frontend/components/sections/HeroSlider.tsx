"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/Button"
import Link from "next/link"

const slides = [
  {
    id: 1,
    background: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ban1.jpg-HjHdBVwhaC7vuzEhqWouFhVOxhdAKr.jpeg",
    title: "Build Your Perfect Bundle",
    subtitle: "Mix and match your favorite products for the ultimate wellness experience.",
    cta: "Create Bundle",
    ctaLink: "/bundle",
    badge: "★★★★★ 100,000+ Five Star Rating",
  },
  {
    id: 2,
    background: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bbbbb.jpg-LBgwySmlr3xSEO9hKOu1UpydPALn2a.jpeg",
    title: "Experience Nature's Power",
    subtitle: "Discover the magical world of functional mushrooms and transform your daily routine.",
    cta: "Shop Now",
    ctaLink: "/shop",
    badge: "🌟 Premium Quality Guaranteed",
  },
  {
    id: 3,
    background: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ban1.jpg-HjHdBVwhaC7vuzEhqWouFhVOxhdAKr.jpeg",
    title: "Join the Wellness Revolution",
    subtitle: "Thousands of customers have already transformed their lives with our products.",
    cta: "Learn More",
    ctaLink: "/about",
    badge: "🚀 Fast & Free Shipping",
  },
]

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Slides */}
      <div className="relative h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-105"
            }`}
          >
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${slide.background})` }}
            >
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-900/40 via-green-800/30 to-transparent"></div>

              {/* Animated particles */}
              <div className="absolute inset-0">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-300/60 rounded-full animate-pulse"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 3}s`,
                      animationDuration: `${2 + Math.random() * 2}s`,
                    }}
                  ></div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex items-center">
              <div className="container">
                <div className="max-w-4xl">
                  {/* Badge */}
                  <div
                    className={`inline-flex items-center px-6 py-3 bg-white/90 backdrop-blur-sm border border-yellow-300 rounded-full text-green-800 text-sm font-bold mb-8 shadow-lg transition-all duration-700 delay-300 ${
                      index === currentSlide ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}
                  >
                    {slide.badge}
                  </div>

                  {/* Title */}
                  <h1
                    className={`text-5xl md:text-7xl lg:text-8xl font-heading font-black text-white leading-tight mb-6 transition-all duration-700 delay-500 ${
                      index === currentSlide ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                    }`}
                    style={{
                      textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                    }}
                  >
                    {slide.title}
                  </h1>

                  {/* Subtitle */}
                  <p
                    className={`text-xl md:text-2xl text-white/90 max-w-3xl leading-relaxed mb-10 transition-all duration-700 delay-700 ${
                      index === currentSlide ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                    }`}
                    style={{
                      textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                    }}
                  >
                    {slide.subtitle}
                  </p>

                  {/* CTA Buttons */}
                  <div
                    className={`flex flex-col sm:flex-row gap-6 transition-all duration-700 delay-900 ${
                      index === currentSlide ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                    }`}
                  >
                    <Link href={slide.ctaLink}>
                      <Button
                        size="lg"
                        className="w-full sm:w-auto text-lg px-10 py-4 bg-white text-green-800 hover:bg-green-50 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                      >
                        {slide.cta}
                      </Button>
                    </Link>
                    <Link href="/shop">
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto text-lg px-10 py-4 border-2 border-white text-white hover:bg-white hover:text-green-800 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                      >
                        View All Products
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 transform -translate-y-1/2 z-20 p-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full transition-all duration-300 group"
      >
        <ChevronLeft className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 transform -translate-y-1/2 z-20 p-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full transition-all duration-300 group"
      >
        <ChevronRight className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75"
            }`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div
          className="h-full bg-white transition-all duration-300 ease-linear"
          style={{
            width: isAutoPlaying ? "100%" : "0%",
            transitionDuration: isAutoPlaying ? "5000ms" : "300ms",
          }}
        />
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 right-8 z-20 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/60 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  )
}
