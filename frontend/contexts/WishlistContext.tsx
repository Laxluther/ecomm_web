"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useAuth } from "./AuthContext"
import { useToast } from "./ToastContext"

interface WishlistItem {
  wishlist_id: number
  product_id: number
  product_name: string
  price: number
  discount_price: number
  image_url: string
  status: string
  created_at: string
}

interface WishlistContextType {
  items: WishlistItem[]
  loading: boolean
  addToWishlist: (productId: number) => Promise<boolean>
  removeFromWishlist: (productId: number) => Promise<boolean>
  isInWishlist: (productId: number) => boolean
  refreshWishlist: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    if (user) {
      refreshWishlist()
    } else {
      setItems([])
    }
  }, [user])

  const refreshWishlist = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await api.getWishlist()

      if (response.data?.wishlist) {
        setItems(response.data.wishlist)
      }
    } catch (error) {
      console.error("Failed to fetch wishlist:", error)
    } finally {
      setLoading(false)
    }
  }

  const addToWishlist = async (productId: number): Promise<boolean> => {
    if (!user) {
      showToast("Please login to add items to wishlist", "error")
      return false
    }

    try {
      const response = await api.addToWishlist(productId)

      if (response.data?.message) {
        showToast(response.data.message, "success")
        await refreshWishlist()
        return true
      } else if (response.error) {
        showToast(response.error, "error")
        return false
      }
    } catch (error) {
      showToast("Failed to add item to wishlist", "error")
    }
    return false
  }

  const removeFromWishlist = async (productId: number): Promise<boolean> => {
    try {
      const response = await api.removeFromWishlist(productId)

      if (response.data?.message) {
        showToast(response.data.message, "success")
        await refreshWishlist()
        return true
      } else if (response.error) {
        showToast(response.error, "error")
        return false
      }
    } catch (error) {
      showToast("Failed to remove item from wishlist", "error")
    }
    return false
  }

  const isInWishlist = (productId: number): boolean => {
    return items.some((item) => item.product_id === productId)
  }

  const value = {
    items,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    refreshWishlist,
  }

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}
