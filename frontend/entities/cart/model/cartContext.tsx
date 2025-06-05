"use client"

import type React from "react"

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import type { CartState, CartAction, CartItem } from "./types"

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
}

const calculateTotals = (items: CartItem[]): { totalItems: number; totalPrice: number } => {
  const totalItems = items.reduce((total, item) => total + item.quantity, 0)
  const totalPrice = items.reduce((total, item) => total + item.totalPrice, 0)
  return { totalItems, totalPrice }
}

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_TO_CART": {
      const existingItemIndex = state.items.findIndex(
        (item) =>
          item.id === action.payload.id &&
          item.selectedSize === action.payload.selectedSize &&
          item.withMechanism === action.payload.withMechanism,
      )

      let newItems
      if (existingItemIndex >= 0) {
        // Update existing item
        newItems = [...state.items]
        const existingItem = newItems[existingItemIndex]
        const updatedItem = {
          ...existingItem,
          quantity: existingItem.quantity + action.payload.quantity,
          totalPrice: existingItem.totalPrice + action.payload.totalPrice,
        }
        newItems[existingItemIndex] = updatedItem
      } else {
        // Add new item
        newItems = [...state.items, action.payload]
      }

      const { totalItems, totalPrice } = calculateTotals(newItems)
      return { items: newItems, totalItems, totalPrice }
    }

    case "REMOVE_FROM_CART": {
      const newItems = state.items.filter((item) => item.id !== action.payload)
      const { totalItems, totalPrice } = calculateTotals(newItems)
      return { items: newItems, totalItems, totalPrice }
    }

    case "UPDATE_QUANTITY": {
      const newItems = state.items.map((item) => {
        if (item.id === action.payload.id) {
          const newQuantity = action.payload.quantity
          const unitPrice = item.totalPrice / item.quantity
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: unitPrice * newQuantity,
          }
        }
        return item
      })
      const { totalItems, totalPrice } = calculateTotals(newItems)
      return { items: newItems, totalItems, totalPrice }
    }

    case "CLEAR_CART":
      return initialState

    default:
      return state
  }
}

const CartContext = createContext<
  | {
      state: CartState
      dispatch: React.Dispatch<CartAction>
    }
  | undefined
>(undefined)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // Load cart from localStorage on initial render
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("cart")
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart) as CartState
        // Initialize with saved cart
        parsedCart.items.forEach((item) => {
          dispatch({ type: "ADD_TO_CART", payload: item })
        })
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error)
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(state))
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error)
    }
  }, [state])

  return <CartContext.Provider value={{ state, dispatch }}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
