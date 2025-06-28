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
  <header className="bg-white border-b border-gray-200">
    {/* Keep your premium banner */}
    
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
            About
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-600 transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </nav>

        {/* Right Icons */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="p-2 hover:text-emerald-600 transition-colors">
            <Search className="h-5 w-5" />
          </Button>
          
          <Link href="/wishlist">
            <Button variant="ghost" size="sm" className="p-2 hover:text-emerald-600 transition-colors">
              <Heart className="h-5 w-5" />
            </Button>
          </Link>

          <Link href="/cart" className="relative">
            <Button variant="ghost" size="sm" className="p-2 hover:text-emerald-600 transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {getTotalItems() > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-emerald-600 text-white">
                  {getTotalItems()}
                </Badge>
              )}
            </Button>
          </Link>

          {/* User menu stays the same */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2 hover:text-emerald-600 transition-colors">
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
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex space-x-2">
              <Button asChild variant="ghost" size="sm" className="hover:text-emerald-600">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link href="/register">Register</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  </header>
)
}
