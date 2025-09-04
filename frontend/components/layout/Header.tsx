"use client"

import type React from "react"

import Link from "next/link"
import { ShoppingCart, User, Search, Heart, LogOut, X, Crown, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth"
import { useCartStore } from "@/lib/store"
import { useState, useEffect } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface HeaderProps {
  transparent?: boolean
}

export function Header({ transparent = false }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth()
  const { getTotalItems } = useCartStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [showPremiumBanner, setShowPremiumBanner] = useState(true)
  const [isClient, setIsClient] = useState(false)

  // Fix hydration: Only run client-side code after hydration
  useEffect(() => {
    setIsClient(true)
    // Only check localStorage after client-side hydration
    const dismissed = localStorage.getItem("premiumBannerDismissed")
    if (dismissed) {
      setShowPremiumBanner(false)
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim() && typeof window !== 'undefined') {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`
    }
  }

  const dismissPremiumBanner = () => {
    setShowPremiumBanner(false)
    if (typeof window !== "undefined") {
      localStorage.setItem("premiumBannerDismissed", "true")
    }
  }

  // Don't render cart items count until client-side hydration is complete
  const cartItemsCount = isClient ? getTotalItems() : 0

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 ${transparent ? 'bg-transparent' : 'bg-white/95 backdrop-blur-sm border-b border-gray-200'}`}>
      {/* Premium Banner */}
      {isClient && showPremiumBanner && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-2 px-4">
          <div className="container mx-auto text-center">
            <div className="flex items-center justify-center space-x-2">
              <Crown className="h-4 w-4" />
              <span className="text-sm font-medium">
                🎉 Premium Quality Products | Free Shipping on Orders ₹500+ | 100% Natural & Chemical-Free
              </span>
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 h-6 w-6 p-0"
            onClick={dismissPremiumBanner}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      {/* Navigation Bar */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center select-none">
            <div className="relative w-40 h-16 select-none">
              <Image 
                src="/images/welnest-logo.png" 
                alt="WellNest Logo" 
                fill 
                className="object-contain select-none" 
                draggable={false}
                style={{userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', pointerEvents: 'none'}}
                unselectable="on"
                onDragStart={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-8">
            {/* About Us and Contact Links */}
            <Link href="/about" className={`font-bold text-xl transition-colors ${transparent ? 'text-white hover:text-green-400' : 'text-gray-900 hover:text-emerald-600'}`}>
              About Us
            </Link>
            <Link href="/contact" className={`font-bold text-xl transition-colors ${transparent ? 'text-white hover:text-green-400' : 'text-gray-900 hover:text-emerald-600'}`}>
              Contact
            </Link>

            {/* Wishlist */}
            {isClient && isAuthenticated && (
              <Link href="/wishlist">
                <Button variant="ghost" size="lg" className={`relative ${transparent ? 'text-white hover:text-green-400' : 'text-gray-900 hover:text-emerald-600'}`}>
                  <Heart className="h-7 w-7" />
                </Button>
              </Link>
            )}

            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="lg" className={`relative ${transparent ? 'text-white hover:text-green-400' : 'text-gray-900 hover:text-emerald-600'}`}>
                <ShoppingCart className="h-7 w-7" />
                {isClient && cartItemsCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-emerald-600">
                    {cartItemsCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            {isClient && isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="lg" className={`${transparent ? 'text-white hover:text-green-400' : 'text-gray-900 hover:text-emerald-600'}`}>
                    <User className="h-7 w-7" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="flex items-center">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist" className="flex items-center">
                      <Heart className="h-4 w-4 mr-2" />
                      Wishlist
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              isClient && (
                <div className="flex items-center space-x-2">
                  <Link href="/login">
                    <Button variant="outline" size="sm" className={transparent ? 'border-white text-white hover:bg-white hover:text-gray-900' : ''}>
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  )
}