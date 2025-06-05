"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShoppingCart, User, Menu, X, Heart } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useWishlist } from "@/contexts/WishlistContext"
import { useCart } from "@/contexts/CartContext"
import { PromoBanner } from "./PromoBanner"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const { items: wishlistItems } = useWishlist()
  const { state: cartState } = useCart()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/")
    setIsAccountMenuOpen(false)
  }

  return (
    <>
      <PromoBanner />
      <header className="bg-white shadow-sm border-b border-green-200">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-06-03%20164205-7pEf7niidZCmRp5huUV9Bw8L1ZdRAI.png"
                  alt="Logo"
                  className="w-5 h-5 filter invert"
                />
              </div>
              <span className="text-xl font-heading font-black text-green-800">LAURIUM IPSUM</span>
            </Link>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/shop" className="text-green-800 hover:text-green-600 font-medium transition-colors">
                Shop
              </Link>
              <Link href="/about" className="text-green-800 hover:text-green-600 font-medium transition-colors">
                About
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="flex items-center space-x-1 text-green-800 hover:text-green-600 transition-colors relative"
              >
                <div className="relative">
                  <Heart className="h-5 w-5" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {wishlistItems.length}
                    </span>
                  )}
                </div>
                <span className="hidden sm:block text-sm">Wishlist</span>
              </Link>

              {/* Account */}
              <div className="relative">
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="flex items-center space-x-1 text-green-800 hover:text-green-600 transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden sm:block text-sm">Account</span>
                </button>

                {isAccountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-green-200">
                    {user ? (
                      <div className="space-y-1">
                        <div className="px-4 py-2 border-b border-green-100">
                          <p className="text-sm font-medium text-green-800">{user.first_name}</p>
                        </div>
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-green-800 hover:bg-green-50"
                          onClick={() => setIsAccountMenuOpen(false)}
                        >
                          Profile
                        </Link>
                        <Link
                          href="/orders"
                          className="block px-4 py-2 text-sm text-green-800 hover:bg-green-50"
                          onClick={() => setIsAccountMenuOpen(false)}
                        >
                          Orders
                        </Link>
                        <Link
                          href="/addresses"
                          className="block px-4 py-2 text-sm text-green-800 hover:bg-green-50"
                          onClick={() => setIsAccountMenuOpen(false)}
                        >
                          Addresses
                        </Link>
                        <Link
                          href="/wallet"
                          className="block px-4 py-2 text-sm text-green-800 hover:bg-green-50"
                          onClick={() => setIsAccountMenuOpen(false)}
                        >
                          Wallet
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Logout
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Link
                          href="/login"
                          className="block px-4 py-2 text-sm text-green-800 hover:bg-green-50"
                          onClick={() => setIsAccountMenuOpen(false)}
                        >
                          Login
                        </Link>
                        <Link
                          href="/register"
                          className="block px-4 py-2 text-sm text-green-800 hover:bg-green-50"
                          onClick={() => setIsAccountMenuOpen(false)}
                        >
                          Sign Up
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart */}
              <Link
                href="/cart"
                className="flex items-center space-x-1 text-green-800 hover:text-green-600 transition-colors"
              >
                <div className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {cartState.summary.total_items > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {cartState.summary.total_items}
                    </span>
                  )}
                </div>
                <span className="hidden sm:block text-sm">
                  ₹{cartState.summary.subtotal?.toFixed(2) || "0.00"} ({cartState.summary.total_items || 0})
                </span>
              </Link>

              {/* Mobile Menu */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-green-800 hover:text-green-600"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-green-200 bg-green-50/50">
              <div className="px-4 py-4 space-y-3">
                <Link
                  href="/shop"
                  className="block text-green-800 hover:text-green-600 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Shop
                </Link>
                <Link
                  href="/about"
                  className="block text-green-800 hover:text-green-600 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </Link>
                <Link
                  href="/wishlist"
                  className="block text-green-800 hover:text-green-600 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Wishlist ({wishlistItems.length})
                </Link>
                {user && (
                  <div className="border-t border-green-200 pt-3 space-y-2">
                    <Link
                      href="/profile"
                      className="block text-green-800 hover:text-green-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/orders"
                      className="block text-green-800 hover:text-green-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Orders
                    </Link>
                    <Link
                      href="/wallet"
                      className="block text-green-800 hover:text-green-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Wallet
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Click outside to close */}
        {isAccountMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setIsAccountMenuOpen(false)}></div>}
      </header>
    </>
  )
}
