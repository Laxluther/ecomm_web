"use client"

import { useState } from "react"
import Image from "next/image"
import Button from "@/shared/ui/button/Button"
import { useFabricCart } from "@/entities/fabric-cart/model/fabricCartContext"
import { useFabricFavorites } from "@/entities/fabric-favorites/model/fabricFavoritesContext"
import styles from "./FabricVariantCard.module.css"
import type { FabricVariant } from "@/shared/api/types"

interface FabricVariantCardProps {
  categoryName: string
  categoryNameRu: string
  collectionName: string
  collectionNameRu: string
  variant: FabricVariant
  className?: string
}

export const FabricVariantCard = ({
  categoryName,
  categoryNameRu,
  collectionName,
  collectionNameRu,
  variant,
  className = "",
}: FabricVariantCardProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const { state: cartState, dispatch: cartDispatch } = useFabricCart()
  const { state: favoritesState, dispatch: favoritesDispatch } = useFabricFavorites()

  // Генерируем уникальный ID для этого варианта ткани
  const variantId = `${categoryName}-${collectionName}-${variant.id}`

  // Проверяем, есть ли этот вариант в корзине
  const isInCart = cartState.items.some((item) => item.id === variantId)

  // Проверяем, есть ли этот вариант в избранном
  const isInFavorites = favoritesState.items.some((item) => item.id === variantId)

  // Фиксированная цена для примера (в реальном приложении должна приходить с сервера)
  const price = 1200 + variant.id * 100

  const handleAddToCart = () => {
    if (isInCart) return

    cartDispatch({
      type: "ADD_TO_CART",
      payload: {
        id: variantId,
        categoryName,
        categoryNameRu,
        collectionName,
        collectionNameRu,
        variant,
        quantity: 1,
        price,
      },
    })
  }

  const handleToggleFavorite = () => {
    if (isInFavorites) {
      favoritesDispatch({
        type: "REMOVE_FROM_FAVORITES",
        payload: variantId,
      })
    } else {
      favoritesDispatch({
        type: "ADD_TO_FAVORITES",
        payload: {
          id: variantId,
          categoryName,
          categoryNameRu,
          collectionName,
          collectionNameRu,
          variant,
        },
      })
    }
  }

  return (
    <div
      className={`${styles.card} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.imageContainer}>
        <Image
          src={variant.image || "/placeholder.svg?height=300&width=300&query=fabric"}
          alt={variant.color.ru}
          width={300}
          height={300}
          className={styles.image}
        />

        <div className={`${styles.actions} ${isHovered ? styles.visible : ""}`}>
          <Button
            variant={isInCart ? "secondary" : "primary"}
            size="sm"
            className={styles.addToCartButton}
            onClick={handleAddToCart}
          >
            {isInCart ? "В корзине" : "В корзину"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`${styles.favoriteButton} ${isInFavorites ? styles.favoriteActive : ""}`}
            onClick={handleToggleFavorite}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                stroke="currentColor"
                strokeWidth="2"
                fill={isInFavorites ? "currentColor" : "none"}
              />
            </svg>
          </Button>
        </div>
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{variant.color.ru}</h3>
        <div className={styles.price}>{price} ₽/м</div>
      </div>
    </div>
  )
}

export default FabricVariantCard
