"use client"

import type React from "react"

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import type { FabricCartItem as FabricCartItemType } from "@/shared/api/types"

// Изменить интерфейс FabricCartItem
interface FabricCartItem extends FabricCartItemType {
  quantity: number
  // Удаляем поле price
}

interface FabricCartState {
  items: FabricCartItem[]
  totalItems: number
  totalPrice: number
}

type FabricCartAction =
  | { type: "ADD_TO_CART"; payload: FabricCartItem }
  | { type: "REMOVE_FROM_CART"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }

const initialState: FabricCartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
}

const calculateTotals = (items: FabricCartItem[]): { totalItems: number; totalPrice: number } => {
  const totalItems = items.reduce((total, item) => total + item.quantity, 0)
  // Цена тканей всегда 0
  const totalPrice = 0
  return { totalItems, totalPrice }
}

const fabricCartReducer = (state: FabricCartState, action: FabricCartAction): FabricCartState => {
  switch (action.type) {
    case "ADD_TO_CART": {
      const existingItemIndex = state.items.findIndex((item) => item.id === action.payload.id)

      let newItems
      if (existingItemIndex >= 0) {
        // Обновляем существующий элемент
        newItems = [...state.items]
        const existingItem = newItems[existingItemIndex]
        const updatedItem = {
          ...existingItem,
          quantity: existingItem.quantity + action.payload.quantity,
        }
        newItems[existingItemIndex] = updatedItem
      } else {
        // Добавляем новый элемент
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
          return {
            ...item,
            quantity: action.payload.quantity,
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

const FabricCartContext = createContext<
  | {
      state: FabricCartState
      dispatch: React.Dispatch<FabricCartAction>
    }
  | undefined
>(undefined)

export const FabricCartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(fabricCartReducer, initialState)

  // Загрузка корзины из localStorage при инициализации
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("fabricCart")
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart) as FabricCartState
        // Инициализация сохраненной корзиной
        parsedCart.items.forEach((item) => {
          dispatch({ type: "ADD_TO_CART", payload: item })
        })
      }
    } catch (error) {
      console.error("Failed to load fabric cart from localStorage:", error)
    }
  }, [])

  // Сохранение корзины в localStorage при изменении
  useEffect(() => {
    try {
      localStorage.setItem("fabricCart", JSON.stringify(state))
    } catch (error) {
      console.error("Failed to save fabric cart to localStorage:", error)
    }
  }, [state])

  return <FabricCartContext.Provider value={{ state, dispatch }}>{children}</FabricCartContext.Provider>
}

export const useFabricCart = () => {
  const context = useContext(FabricCartContext)
  if (context === undefined) {
    throw new Error("useFabricCart must be used within a FabricCartProvider")
  }
  return context
}
