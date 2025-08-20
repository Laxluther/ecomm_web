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

export function Header() {
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
    <header className="bg-white border-b border-gray-200">
      {/* Premium Banner - Only show after client hydration */}
      {isClient && showPremiumBanner && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-2 px-4 relative">
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
      
      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo + Text - Bigger and Better */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative w-16 h-14">
              <Image 
                src="/images/welnest-logo.png" 
                alt="WelNest Logo" 
                fill 
                className="object-contain" 
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-2xl text-emerald-800 tracking-wide">WelNest</span>
              <span className="text-sm text-emerald-600 -mt-1 font-medium">Natural & Pure</span>
            </div>
          </Link>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            <Link href="/shop" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors relative group">
              Shop
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors relative group">
              About Us
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors relative group">
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Input
                type="text"
                placeholder="Search for natural products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border-2 border-gray-200 focus:border-emerald-500 rounded-full"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </form>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            {/* Search Icon for Mobile */}
            <Button variant="ghost" size="sm" className="lg:hidden">
              <Search className="h-5 w-5" />
            </Button>

            {/* Wishlist */}
            {isClient && isAuthenticated && (
              <Link href="/wishlist">
                <Button variant="ghost" size="sm" className="relative">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>
            )}

            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="sm" className="relative">
                <ShoppingCart className="h-5 w-5" />
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
                  <Button variant="ghost" size="sm">
                    <User className="h-5 w-5" />
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
                    <Button variant="outline" size="sm">
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