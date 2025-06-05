export interface FavoriteItem {
  id: string
  product: {
    id: string
    name: string
    price: number
    image: string
    category: string
    slug: string
    categoryName: string
  }
}

export interface FavoritesState {
  items: FavoriteItem[]
  totalItems: number
}

export type FavoritesAction =
  | { type: "ADD_TO_FAVORITES"; payload: FavoriteItem }
  | { type: "REMOVE_FROM_FAVORITES"; payload: string }
  | { type: "CLEAR_FAVORITES" }
