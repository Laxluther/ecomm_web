"use client"

import type React from "react"

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import type { FabricFavoriteItem } from "@/shared/api/types"

interface FabricFavoritesState {
  items: FabricFavoriteItem[]
  totalItems: number
}

type FabricFavoritesAction =
  | { type: "ADD_TO_FAVORITES"; payload: FabricFavoriteItem }
  | { type: "REMOVE_FROM_FAVORITES"; payload: string }
  | { type: "CLEAR_FAVORITES" }

const initialState: FabricFavoritesState = {
  items: [],
  totalItems: 0,
}

const fabricFavoritesReducer = (state: FabricFavoritesState, action: FabricFavoritesAction): FabricFavoritesState => {
  switch (action.type) {
    case "ADD_TO_FAVORITES": {
      const existingItemIndex = state.items.findIndex((item) => item.id === action.payload.id)

      if (existingItemIndex >= 0) {
        // Элемент уже в избранном, ничего не делаем
        return state
      }

      // Добавляем новый элемент
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

const FabricFavoritesContext = createContext<
  | {
      state: FabricFavoritesState
      dispatch: React.Dispatch<FabricFavoritesAction>
    }
  | undefined
>(undefined)

export const FabricFavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(fabricFavoritesReducer, initialState)

  // Загрузка избранного из localStorage при инициализации
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem("fabricFavorites")
      if (savedFavorites) {
        const parsedFavorites = JSON.parse(savedFavorites) as FabricFavoritesState
        // Инициализация сохраненным избранным
        parsedFavorites.items.forEach((item) => {
          dispatch({ type: "ADD_TO_FAVORITES", payload: item })
        })
      }
    } catch (error) {
      console.error("Failed to load fabric favorites from localStorage:", error)
    }
  }, [])

  // Сохранение избранного в localStorage при изменении
  useEffect(() => {
    try {
      localStorage.setItem("fabricFavorites", JSON.stringify(state))
    } catch (error) {
      console.error("Failed to save fabric favorites to localStorage:", error)
    }
  }, [state])

  return <FabricFavoritesContext.Provider value={{ state, dispatch }}>{children}</FabricFavoritesContext.Provider>
}

export const useFabricFavorites = () => {
  const context = useContext(FabricFavoritesContext)
  if (context === undefined) {
    throw new Error("useFabricFavorites must be used within a FabricFavoritesProvider")
  }
  return context
}
