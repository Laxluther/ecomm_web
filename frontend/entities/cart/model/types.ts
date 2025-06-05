import type { SofaData, BedData } from "@/shared/api/types"

export interface CartItem {
  id: string
  product: SofaData | BedData
  quantity: number
  selectedSize: number | null
  withMechanism?: boolean
  totalPrice: number
}

export interface CartState {
  items: CartItem[]
  totalItems: number
  totalPrice: number
}

export type CartAction =
  | { type: "ADD_TO_CART"; payload: CartItem }
  | { type: "REMOVE_FROM_CART"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }
