"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"

interface CartItem {
  id: string
  product_id: number
  product_name: string
  price: number
  quantity: number
  image_url: string
  created_at: string
}

interface CartSummary {
  subtotal: number
  total_items: number
  total_savings: number
}

interface CartState {
  items: CartItem[]
  summary: CartSummary
  loading: boolean
}

type CartAction =
  | { type: "SET_CART"; payload: { items: CartItem[]; summary: CartSummary } }
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "SET_LOADING"; payload: boolean }

const initialState: CartState = {
  items: [],
  summary: {
    subtotal: 0,
    total_items: 0,
    total_savings: 0,
  },
  loading: false,
}

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "SET_CART":
      return {
        ...state,
        items: action.payload.items,
        summary: action.payload.summary,
        loading: false,
      }
    case "ADD_ITEM":
      return {
        ...state,
        items: [...state.items, action.payload],
        summary: {
          ...state.summary,
          subtotal: state.summary.subtotal + action.payload.price * action.payload.quantity,
          total_items: state.summary.total_items + action.payload.quantity,
        },
      }
    case "REMOVE_ITEM": {
      const itemToRemove = state.items.find((item) => item.id === action.payload)
      if (!itemToRemove) return state

      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
        summary: {
          ...state.summary,
          subtotal: state.summary.subtotal - itemToRemove.price * itemToRemove.quantity,
          total_items: state.summary.total_items - itemToRemove.quantity,
        },
      }
    }
    case "UPDATE_QUANTITY": {
      const itemIndex = state.items.findIndex((item) => item.id === action.payload.id)
      if (itemIndex === -1) return state

      const item = state.items[itemIndex]
      const quantityDiff = action.payload.quantity - item.quantity

      const updatedItems = [...state.items]
      updatedItems[itemIndex] = {
        ...item,
        quantity: action.payload.quantity,
      }

      return {
        ...state,
        items: updatedItems,
        summary: {
          ...state.summary,
          subtotal: state.summary.subtotal + item.price * quantityDiff,
          total_items: state.summary.total_items + quantityDiff,
        },
      }
    }
    case "CLEAR_CART":
      return initialState
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      }
    default:
      return state
  }
}

interface CartContextType {
  state: CartState
  dispatch: React.Dispatch<CartAction>
  addToCart: (item: Omit<CartItem, "id" | "created_at">) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // Load cart from localStorage on initial render
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("cart")
      console.log("Loading cart from localStorage:", savedCart)
      if (savedCart) {
        const { items, summary } = JSON.parse(savedCart)
        // Validate the data structure
        if (Array.isArray(items) && summary && typeof summary.subtotal === "number") {
          dispatch({ type: "SET_CART", payload: { items, summary } })
        } else {
          console.warn("Invalid cart data structure, clearing cart")
          localStorage.removeItem("cart")
        }
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error)
      localStorage.removeItem("cart") // Clear corrupted data
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      // Only save if we have valid data
      if (state.items.length > 0 || state.summary.subtotal > 0) {
        const cartData = {
          items: state.items,
          summary: state.summary,
        }
        console.log("Saving cart to localStorage:", cartData)
        localStorage.setItem("cart", JSON.stringify(cartData))
      }
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error)
    }
  }, [state.items, state.summary])

  const addToCart = (item: Omit<CartItem, "id" | "created_at">) => {
    const price = typeof item.price === "number" ? item.price : Number.parseFloat(item.price) || 0
    const newItem: CartItem = {
      ...item,
      price, // Ensure price is a number
      id: `${item.product_id}-${Date.now()}`,
      created_at: new Date().toISOString(),
    }
    dispatch({ type: "ADD_ITEM", payload: newItem })
  }

  const removeFromCart = (id: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: id })
  }

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" })
  }

  return (
    <CartContext.Provider value={{ state, dispatch, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
