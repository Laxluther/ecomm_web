"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import type { FavoritesState, FavoritesAction } from "./types"

const initialState: FavoritesState = {
  items: [],
  totalItems: 0,
}

const favoritesReducer = (state: FavoritesState, action: FavoritesAction): FavoritesState => {
  switch (action.type) {
    case "ADD_TO_FAVORITES": {
      const existingItemIndex = state.items.findIndex((item) => item.id === action.payload.id)

      if (existingItemIndex >= 0) {
        // Item already in favorites, do nothing
        return state
      }

      // Add new item
      const newItems = [...state.items, action.payload]
      return { items: newItems, totalItems: newItems.length }
    }

    case "REMOVE_FROM_FAVORITES": {
      const newItems = state.items.filter((item) => item.id !== action.payload)
      return { items: newItems, totalItems: newItems.length }
    }

    case "CLEAR_FAVORITES":
      return initialState

    default:
      return state
  }
}

const FavoritesContext = createContext<
  | {
      state: FavoritesState
      dispatch: React.Dispatch<FavoritesAction>
    }
  | undefined
>(undefined)

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(favoritesReducer, initialState)

  // Load favorites from localStorage on initial render
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem("favorites")
      if (savedFavorites) {
        const parsedFavorites = JSON.parse(savedFavorites) as FavoritesState
        // Initialize with saved favorites
        parsedFavorites.items.forEach((item) => {
          dispatch({ type: "ADD_TO_FAVORITES", payload: item })
        })
      }
    } catch (error) {
      console.error("Failed to load favorites from localStorage:", error)
    }
  }, [])

  // Save favorites to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("favorites", JSON.stringify(state))
    } catch (error) {
      console.error("Failed to save favorites to localStorage:", error)
    }
  }, [state])

  return <FavoritesContext.Provider value={{ state, dispatch }}>{children}</FavoritesContext.Provider>
}

export const useFavorites = () => {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider")
  }
  return context
}
