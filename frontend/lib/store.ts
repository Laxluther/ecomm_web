"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface CartItem {
  cart_id: number
  product_id: number
  product_name: string
  quantity: number
  price: number
  discount_price: number
  image_url: string
}

interface CartState {
  items: CartItem[]
  hasHydrated: boolean
  setHasHydrated: () => void
  addItem: (item: CartItem) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,

      setHasHydrated: () => set({ hasHydrated: true }),

      addItem: (item: CartItem) => {
        const items = get().items
        const existingItem = items.find((i) => i.product_id === item.product_id)

        if (existingItem) {
          set({
            items: items.map((i) =>
              i.product_id === item.product_id ? { ...i, quantity: i.quantity + item.quantity } : i,
            ),
          })
        } else {
          set({ items: [...items, item] })
        }
      },

      removeItem: (productId: number) => {
        set({
          items: get().items.filter((item) => item.product_id !== productId),
        })
      },

      updateQuantity: (productId: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }

        set({
          items: get().items.map((item) => (item.product_id === productId ? { ...item, quantity } : item)),
        })
      },

      clearCart: () => {
        set({ items: [] })
      },

      getTotalItems: () => {
        const state = get()
        // Only return count after hydration to prevent mismatches
        if (!state.hasHydrated) return 0
        return state.items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        const state = get()
        // Only return price after hydration to prevent mismatches
        if (!state.hasHydrated) return 0
        return state.items.reduce((total, item) => total + item.discount_price * item.quantity, 0)
      },
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({
        items: state.items,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated()
      },
    },
  ),
)