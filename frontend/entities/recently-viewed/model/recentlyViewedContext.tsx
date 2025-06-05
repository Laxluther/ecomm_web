"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import type { SofaData, BedData } from "@/shared/api/types"

export interface RecentlyViewedItem {
  id: string
  product: SofaData | BedData
  timestamp: number
}

export interface RecentlyViewedState {
  items: RecentlyViewedItem[]
}

export type RecentlyViewedAction =
  | { type: "ADD_VIEWED_PRODUCT"; payload: RecentlyViewedItem }
  | { type: "CLEAR_VIEWED_PRODUCTS" }

const initialState: RecentlyViewedState = {
  items: [],
}

const MAX_RECENTLY_VIEWED = 10

const recentlyViewedReducer = (state: RecentlyViewedState, action: RecentlyViewedAction): RecentlyViewedState => {
  switch (action.type) {
    case "ADD_VIEWED_PRODUCT": {
      // Check if product already exists
      const existingItemIndex = state.items.findIndex((item) => item.id === action.payload.id)

      if (existingItemIndex >= 0) {
        // Update timestamp for existing item and move it to the front
        const updatedItems = [...state.items]
        const existingItem = { ...updatedItems[existingItemIndex], timestamp: action.payload.timestamp }
        updatedItems.splice(existingItemIndex, 1) // Remove existing item
        return { items: [existingItem, ...updatedItems] } // Add to front
      }

      // Add new item to the front, limit to MAX_RECENTLY_VIEWED items
      const newItems = [action.payload, ...state.items].slice(0, MAX_RECENTLY_VIEWED)
      return { items: newItems }
    }

    case "CLEAR_VIEWED_PRODUCTS":
      return initialState

    default:
      return state
  }
}

const RecentlyViewedContext = createContext<
  | {
      state: RecentlyViewedState
      dispatch: React.Dispatch<RecentlyViewedAction>
      addViewedProduct: (product: SofaData | BedData) => void
    }
  | undefined
>(undefined)

export const RecentlyViewedProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(recentlyViewedReducer, initialState)

  // Load recently viewed from localStorage on initial render
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem("recentlyViewed")
      if (savedItems) {
        const parsedItems = JSON.parse(savedItems) as RecentlyViewedItem[]
        // Initialize with saved items, adding them one by one to maintain order
        parsedItems.reverse().forEach((item) => {
          dispatch({ type: "ADD_VIEWED_PRODUCT", payload: item })
        })
      }
    } catch (error) {
      console.error("Failed to load recently viewed products from localStorage:", error)
    }
  }, [])

  // Save recently viewed to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("recentlyViewed", JSON.stringify(state.items))
    } catch (error) {
      console.error("Failed to save recently viewed products to localStorage:", error)
    }
  }, [state])

  // Helper function to add a viewed product
  const addViewedProduct = (product: SofaData | BedData) => {
    dispatch({
      type: "ADD_VIEWED_PRODUCT",
      payload: {
        id: product.id,
        product,
        timestamp: Date.now(),
      },
    })
  }

  return (
    <RecentlyViewedContext.Provider value={{ state, dispatch, addViewedProduct }}>
      {children}
    </RecentlyViewedContext.Provider>
  )
}

export const useRecentlyViewed = () => {
  const context = useContext(RecentlyViewedContext)
  if (context === undefined) {
    throw new Error("useRecentlyViewed must be used within a RecentlyViewedProvider")
  }
  return context
}
