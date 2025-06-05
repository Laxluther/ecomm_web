"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import type { SofaData, BedData } from "@/shared/api/types"
import Button from "@/shared/ui/button/Button"
import { useCart } from "@/entities/cart/model/cartContext"
import { useFavorites } from "@/entities/favorites/model/favoritesContext"
import styles from "./ProductCard.module.css"

interface ProductCardProps {
  product: SofaData | BedData
  className?: string
  showOptions?: boolean
}

export const ProductCard = ({ product, className = "", showOptions = false }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const [selectedSize, setSelectedSize] = useState<number>(0)
  const [withMechanism, setWithMechanism] = useState(false)
  const [showOptionsPanel, setShowOptionsPanel] = useState(false)

  const { state: cartState, dispatch: cartDispatch } = useCart()
  const { state: favoritesState, dispatch: favoritesDispatch } = useFavorites()

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setShowOptionsPanel(false)
  }

  const isBed = "bed" in product
  const category = isBed ? "bed" : "sofa"
  const productUrl = `/products/${category}/${product.slug}`

  // Get sizes based on product type
  const getSizes = () => {
    if (isBed && product.bed && Array.isArray(product.bed)) {
      return product.bed.map((size) => ({
        width: size.width,
        length: size.length,
        price: size.price,
      }))
    } else if (
      !isBed &&
      "sizes" in product &&
      product.sizes &&
      product.sizes.sofa &&
      Array.isArray(product.sizes.sofa)
    ) {
      return product.sizes.sofa.map((size) => ({
        width: size.width,
        length: size.length,
        price: size.price,
      }))
    }
    return []
  }

  const sizes = getSizes()

  // Check if lifting mechanism is available for the selected size
  const hasLiftingMechanism = () => {
    return (
      isBed &&
      product.bed &&
      product.bed[selectedSize] &&
      product.bed[selectedSize].lifting_mechanism &&
      product.bed[selectedSize].lifting_mechanism.length > 1
    )
  }

  // Get price with selected options
  const getPrice = () => {
    if (!sizes || sizes.length === 0) {
      return product.price.current
    }

    let price = sizes[selectedSize].price

    // Add mechanism price for beds
    if (isBed && withMechanism && hasLiftingMechanism()) {
      price += product.bed[selectedSize].lifting_mechanism[1].price
    }

    return price
  }

  // Generate a unique ID for this product configuration
  const getCartItemId = () => {
    return `${product.id}-${selectedSize}-${withMechanism}`
  }

  // Check if this exact configuration is in cart
  const isInCart = cartState.items.some((item) => item.id === getCartItemId())

  // Check if product is in favorites
  const isInFavorites = favoritesState.items.some((item) => item.id === product.id)

  const handleAddToCart = () => {
    if (isInCart) {
      // Navigate to cart if already in cart
      window.location.href = "/cart"
      return
    }

    const price = getPrice()

    cartDispatch({
      type: "ADD_TO_CART",
      payload: {
        id: getCartItemId(),
        product,
        quantity: 1,
        selectedSize,
        withMechanism,
        totalPrice: price,
      },
    })
  }

  const handleToggleFavorite = () => {
    if (isInFavorites) {
      favoritesDispatch({
        type: "REMOVE_FROM_FAVORITES",
        payload: product.id,
      })
    } else {
      favoritesDispatch({
        type: "ADD_TO_FAVORITES",
        payload: {
          id: product.id,
          product,
        },
      })
    }
  }

  const toggleOptionsPanel = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowOptionsPanel(!showOptionsPanel)
  }

  // Handle single-click activation for mechanism checkbox
  const handleMechanismToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    setWithMechanism(!withMechanism)
  }

  // Get primary and secondary images
  const primaryImage = product.images[0] || "/placeholder.svg"
  const secondaryImage = product.images[1] || product.images[0] || "/placeholder.svg"

  return (
    <div
      className={`${styles.productCard} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={productUrl} className={styles.imageContainer}>
        <div className={styles.imageWrapper}>
          <Image
            src={primaryImage || "/placeholder.svg"}
            alt={product.name}
            width={300}
            height={300}
            className={`${styles.image} ${!isHovered ? styles.active : ""}`}
          />
          <Image
            src={secondaryImage || "/placeholder.svg"}
            alt={`${product.name} - альтернативное изображение`}
            width={300}
            height={300}
            className={`${styles.image} ${isHovered ? styles.active : ""}`}
          />
        </div>
        {product.availability === "В наличии" && <span className={styles.inStock}>В наличии</span>}

        {showOptions && isBed && sizes.length > 0 && (
          <button
            className={`${styles.optionsButton} ${showOptionsPanel ? styles.active : ""}`}
            onClick={toggleOptionsPanel}
          >
            {showOptionsPanel ? "Скрыть опции" : "Выбрать опции"}
          </button>
        )}
      </Link>

      {showOptions && showOptionsPanel && isBed && sizes.length > 0 && (
        <div className={styles.optionsPanel}>
          <div className={styles.optionsHeader}>
            <h4 className={styles.optionsTitle}>Выберите опции</h4>
            <button
              className={styles.closeOptionsButton}
              onClick={(e) => {
                e.preventDefault()
                setShowOptionsPanel(false)
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className={styles.optionsContent}>
            <div className={styles.optionGroup}>
              <label className={styles.optionLabel}>Размер:</label>
              <div className={styles.sizeOptions}>
                {sizes.map((size, index) => (
                  <button
                    key={index}
                    className={`${styles.sizeOption} ${selectedSize === index ? styles.active : ""}`}
                    onClick={(e) => {
                      e.preventDefault()
                      setSelectedSize(index)
                      // Reset mechanism when changing size
                      setWithMechanism(false)
                    }}
                  >
                    {size.width}x{size.length} см
                  </button>
                ))}
              </div>
            </div>

            {hasLiftingMechanism() && (
              <div className={styles.optionGroup}>
                <div
                  className={`${styles.mechanismOption} ${withMechanism ? styles.active : ""}`}
                  onClick={handleMechanismToggle}
                >
                  <div className={styles.checkboxWrapper}>
                    <div className={`${styles.customCheckbox} ${withMechanism ? styles.checked : ""}`}>
                      {withMechanism && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M20 6L9 17L4 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className={styles.mechanismText}>
                    Подъемный механизм (+
                    {product.bed[selectedSize].lifting_mechanism[1].price} руб.)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={styles.content}>
        <Link href={productUrl} className={styles.title}>
          {product.name}
        </Link>

        {isBed && sizes.length > 0 && (
          <div className={styles.productOptions}>
            <span className={styles.selectedSize}>
              {sizes[selectedSize].width}x{sizes[selectedSize].length} см
              {withMechanism && hasLiftingMechanism() ? ", с подъемным механизмом" : ""}
            </span>
          </div>
        )}

        <div className={styles.price}>
          <span className={styles.currentPrice}>{getPrice()} руб.</span>
          {product.price.old && <span className={styles.oldPrice}>{product.price.old} руб.</span>}
        </div>

        <div className={styles.actions}>
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
    </div>
  )
}

export default ProductCard
