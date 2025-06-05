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
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.discount_price * item.quantity, 0)
      },
    }),
    {
      name: "cart-storage",
    },
  ),
)
