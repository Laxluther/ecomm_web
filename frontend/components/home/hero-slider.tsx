"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroSlider() {
  return (
    <div className="relative h-[100vh] overflow-hidden">
      {/* Split Screen Background */}
      <div className="absolute inset-0 grid grid-cols-2">
        {/* Left Side - Coffee & Cheese */}
        <div className="relative">
          <Image
            src="/images/hero-banner-1.png"
            alt="Coffee beans and cheese"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
        
        {/* Right Side - Nuts & Snacks */}
        <div className="relative">
          <Image
            src="/images/hero-banner-2.png"
            alt="Premium nuts and snacks"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      </div>

      {/* Hero Content */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center text-white max-w-6xl mx-auto px-4">
          <h1 className="font-kablammo text-6xl md:text-7xl font-bold mb-12 leading-relaxed">
            <div className="text-center">FEEL THE GOODNESS,</div>
            <div className="text-right">LIVE THE WELLNESS</div>
          </h1>
          
          <Button 
            asChild 
            size="lg" 
            className="bg-white/90 hover:bg-white text-gray-900 px-8 py-4 text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border-2 border-white/20"
          >
            <Link href="/shop">
              Start Your Wellness Journey
            </Link>
          </Button>
        </div>
      </div>

    </div>
  )
}