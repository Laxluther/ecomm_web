"use client"

import { useState } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

const promoMessages = [
  "NEW! HBO Original The Last of Us High Caf Ground Coffee | Shop Now",
  "Free Shipping for orders over $59 | 60-day Money Back Guarantee",
  "★★★★★ 100,000+ Five Star Rating | Join the Mushroom Movement",
]

export function PromoBanner() {
  const [currentMessage, setCurrentMessage] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const nextMessage = () => {
    setCurrentMessage((prev) => (prev + 1) % promoMessages.length)
  }

  const prevMessage = () => {
    setCurrentMessage((prev) => (prev - 1 + promoMessages.length) % promoMessages.length)
  }

  if (!isVisible) return null

  return (
    <div className="promo-banner relative">
      <div className="container flex items-center justify-between">
        <button onClick={prevMessage} className="p-1 hover:bg-white/20 rounded">
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex-1 text-center">
          <span className="text-sm font-medium">{promoMessages[currentMessage]}</span>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={nextMessage} className="p-1 hover:bg-white/20 rounded">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button onClick={() => setIsVisible(false)} className="p-1 hover:bg-white/20 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
