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

  // Check if banner was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem("premiumBannerDismissed")
    if (dismissed) {
      setShowPremiumBanner(false)
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`
    }
  }

  const dismissPremiumBanner = () => {
    setShowPremiumBanner(false)
    localStorage.setItem("premiumBannerDismissed", "true")
  }

  return (
    <header className="bg-white shadow-sm">
      {/* Premium Banner */}
      {showPremiumBanner && (
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Crown className="h-5 w-5 text-yellow-300" />
                  <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
                </div>
                <div>
                  <span className="font-bold text-lg">🌿 PREMIUM FOREST COLLECTION</span>
                  <span className="ml-3 text-emerald-100">
                    Limited Time: Get 25% OFF on all Honey Products + FREE Shipping
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/shop?category=1"
                  className="bg-yellow-400 text-emerald-900 px-4 py-1 rounded-full font-semibold hover:bg-yellow-300 transition-colors text-sm"
                >
                  Shop Now
                </Link>
                <button
                  onClick={dismissPremiumBanner}
                  className="text-emerald-100 hover:text-white transition-colors p-1"
                  aria-label="Dismiss banner"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative w-12 h-12">
              <Image src="/images/squirrel-logo.png" alt="lorem ipsum Logo" fill className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-2xl text-emerald-800 tracking-wide">lorem ipsum</span>
              <span className="text-xs text-emerald-600 -mt-1">Natural & Pure</span>
            </div>
          </Link>

          {/* Main Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/shop" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              Shop
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              About
            </Link>
          </nav>

          {/* Right Navigation */}
          <div className="flex items-center space-x-4">
            {/* Search Icon (Mobile) */}
            <Button variant="ghost" size="sm" className="md:hidden p-2">
              <Search className="h-5 w-5" />
            </Button>

            {/* Wishlist */}
            <Link href="/wishlist">
              <Button variant="ghost" size="sm" className="p-2 hover:text-emerald-600">
                <Heart className="h-5 w-5" />
              </Button>
            </Link>

            {/* Cart */}
            <Link href="/cart" className="relative">
              <Button variant="ghost" size="sm" className="p-2 hover:text-emerald-600">
                <ShoppingCart className="h-5 w-5" />
                {getTotalItems() > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-emerald-600">
                    {getTotalItems()}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2 hover:text-emerald-600">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders">Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist">Wishlist</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/referrals">Referrals</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex space-x-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar - Full Width Below Header */}
      <div className="border-t border-b border-gray-200 py-3 hidden md:block">
        <div className="container mx-auto px-4">
          <form onSubmit={handleSearch} className="max-w-md mx-auto">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search natural products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <Button type="submit" size="sm" className="absolute right-1 top-1 h-8 w-8 p-0" variant="ghost">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </header>
  )
}
