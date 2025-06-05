"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import Breadcrumbs from "@/shared/ui/breadcrumbs/Breadcrumbs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, ShoppingCart, ZoomIn, Check, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFabricCart } from "@/entities/fabric-cart/model/fabricCartContext"
import { useFabricFavorites } from "@/entities/fabric-favorites/model/fabricFavoritesContext"
import type { FabricCategory, FabricCollection, FabricVariant } from "@/shared/api/types"
import FabricCollectionCard from "@/entities/fabric/ui/FabricCollectionCard"
import styles from "./FabricDetail.module.css"

interface FabricDetailProps {
  category: FabricCategory
  collection: FabricCollection
  similarCollections: FabricCollection[]
  categoryId: string
}

export default function FabricDetail({ category, collection, similarCollections, categoryId }: FabricDetailProps) {
  const { state: cartState, dispatch: cartDispatch } = useFabricCart()
  const { state: favoritesState, dispatch: favoritesDispatch } = useFabricFavorites()

  // State for selected variant
  const [selectedVariant, setSelectedVariant] = useState<FabricVariant | null>(
    collection.variants && collection.variants.length > 0 ? collection.variants[0] : null,
  )

  // State for zoom functionality
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })
  const [zoomLevel, setZoomLevel] = useState(2)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null)

  // State for showing all color variants
  const [showAllVariants, setShowAllVariants] = useState(false)
  const MAX_VISIBLE_VARIANTS = 9

  // Get visible variants based on showAllVariants state
  const visibleVariants =
    collection.variants && collection.variants.length > 0
      ? showAllVariants || collection.variants.length <= MAX_VISIBLE_VARIANTS
        ? collection.variants
        : collection.variants.slice(0, MAX_VISIBLE_VARIANTS)
      : []

  // Calculate how many variants are hidden
  const hiddenVariantsCount = collection.variants ? Math.max(0, collection.variants.length - MAX_VISIBLE_VARIANTS) : 0

  // Generate a unique ID for the current variant
  const getVariantId = (variant: FabricVariant) => `${categoryId}-${collection.name}-${variant.id}`

  // Check if variant is in cart/favorites
  const isVariantInCart = selectedVariant
    ? cartState.items.some((item) => item.id === getVariantId(selectedVariant))
    : false

  const isVariantInFavorites = selectedVariant
    ? favoritesState.items.some((item) => item.id === getVariantId(selectedVariant))
    : false

  // Handle mouse move for zoom effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed || !imageContainerRef.current) return

    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100

    setZoomPosition({ x, y })
  }

  // Handle mouse leave for zoom container
  const handleMouseLeave = () => {
    if (isZoomed) {
      setIsZoomed(false)
    }
  }

  // Toggle zoom state
  const toggleZoom = () => {
    setIsZoomed(!isZoomed)
  }

  // Handle adding to cart
  const handleAddToCart = () => {
    if (!selectedVariant) return

    if (!isVariantInCart) {
      cartDispatch({
        type: "ADD_TO_CART",
        payload: {
          id: getVariantId(selectedVariant),
          categoryName: categoryId,
          categoryNameRu: category.name_ru,
          collectionName: collection.name,
          collectionNameRu: collection.name_ru,
          variant: selectedVariant,
          quantity: 1,
        },
      })

      // Show success message
      setShowSuccessMessage("Ткань добавлена в корзину")
      setTimeout(() => setShowSuccessMessage(null), 3000)
    } else {
      // Redirect to cart page when already in cart
      window.location.href = "/cart"
    }
  }

  // Handle toggling favorites
  const handleToggleFavorite = () => {
    if (!selectedVariant) return

    if (!isVariantInFavorites) {
      favoritesDispatch({
        type: "ADD_TO_FAVORITES",
        payload: {
          id: getVariantId(selectedVariant),
          categoryName: categoryId,
          categoryNameRu: category.name_ru,
          collectionName: collection.name,
          collectionNameRu: collection.name_ru,
          variant: selectedVariant,
        },
      })

      // Show success message
      setShowSuccessMessage("Ткань добавлена в избранное")
      setTimeout(() => setShowSuccessMessage(null), 3000)
    } else {
      favoritesDispatch({
        type: "REMOVE_FROM_FAVORITES",
        payload: getVariantId(selectedVariant),
      })
    }
  }

  // Get placeholder image if no variant is selected
  const selectedImage =
    selectedVariant?.image || `/placeholder.svg?height=600&width=600&query=${collection.name_ru}%20fabric`

  // Clear success message when changing variants
  useEffect(() => {
    setShowSuccessMessage(null)
  }, [selectedVariant])

  return (
    <div className={styles.container}>
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Ткани", href: "/fabrics" },
          { label: category.name_ru, href: `/fabrics/${categoryId}` },
          { label: collection.name_ru, href: "", isCurrent: true },
        ]}
        className={styles.breadcrumbs}
      />

      {/* Back button */}
      <Link href={`/fabrics/${categoryId}`} className={styles.backButton}>
        <ArrowLeft size={16} />
        <span>Назад к коллекциям</span>
      </Link>

      <div className={styles.fabricDetailGrid}>
        {/* Left column - Images */}
        <div className={styles.imageSection}>
          <div
            ref={imageContainerRef}
            className={`${styles.mainImageContainer} ${isZoomed ? styles.zoomed : ""}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={toggleZoom}
            style={
              isZoomed
                ? ({
                    "--zoom-x": `${zoomPosition.x}%`,
                    "--zoom-y": `${zoomPosition.y}%`,
                    "--zoom-level": zoomLevel,
                  } as React.CSSProperties)
                : undefined
            }
          >
            <Image
              src={selectedImage || "/placeholder.svg"}
              alt={selectedVariant?.color.ru || collection.name_ru}
              width={800}
              height={800}
              className={styles.mainImage}
              priority
            />

            <div className={styles.zoomInstructions}>
              <ZoomIn size={16} />
              <span>{isZoomed ? "Нажмите, чтобы уменьшить" : "Нажмите, чтобы увеличить"}</span>
            </div>
          </div>

          {/* Color variants */}
          {collection.variants && collection.variants.length > 0 && (
            <div className={styles.colorVariantsSection}>
              <h3 className={styles.colorSectionTitle}>
                Доступные цвета {collection.variants.length > 0 && `(${collection.variants.length})`}
              </h3>
              <div className={styles.colorVariants}>
                {visibleVariants.map((variant) => (
                  <button
                    key={variant.id}
                    className={`${styles.colorVariantButton} ${
                      selectedVariant?.id === variant.id ? styles.selectedVariant : ""
                    }`}
                    onClick={() => setSelectedVariant(variant)}
                    aria-label={`Выбрать цвет: ${variant.color.ru}`}
                  >
                    <div className={styles.colorVariantImageWrapper}>
                      <Image
                        src={variant.image || `/placeholder.svg?height=80&width=80&query=${variant.color.ru}%20fabric`}
                        alt={variant.color.ru}
                        width={80}
                        height={80}
                        className={styles.colorVariantImage}
                      />
                      {selectedVariant?.id === variant.id && (
                        <div className={styles.selectedCheck}>
                          <Check size={16} />
                        </div>
                      )}
                    </div>
                    <span className={styles.colorVariantName}>{variant.color.ru}</span>
                  </button>
                ))}
              </div>

              {/* Show more/less button */}
              {hiddenVariantsCount > 0 && (
                <button className={styles.showMoreButton} onClick={() => setShowAllVariants(!showAllVariants)}>
                  {showAllVariants
                    ? "Свернуть"
                    : `Развернуть еще ${hiddenVariantsCount} ${
                        hiddenVariantsCount === 1 ? "цвет" : hiddenVariantsCount < 5 ? "цвета" : "цветов"
                      }`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right column - Details */}
        <div className={styles.detailsSection}>
          <h1 className={styles.fabricTitle}>{collection.name_ru}</h1>

          <div className={styles.fabricMeta}>
            <div className={styles.fabricCategory}>
              <span className={styles.categoryLabel}>Категория:</span>
              <Link href={`/fabrics/${categoryId}`} className={styles.categoryValue}>
                {category.name_ru}
              </Link>
            </div>

            {collection.type && (
              <div className={styles.fabricType}>
                <span className={styles.typeLabel}>Тип:</span>
                <span className={styles.typeValue}>{collection.type}</span>
              </div>
            )}

            {collection.availability && (
              <div className={styles.fabricAvailability}>
                <span className={styles.availabilityDot}></span>
                <span className={styles.availabilityText}>{collection.availability}</span>
              </div>
            )}
          </div>

          {selectedVariant && (
            <div className={styles.selectedVariantInfo}>
              <div className={styles.selectedVariantColor}>
                <span className={styles.selectedColorLabel}>Выбранный цвет:</span>
                <span className={styles.selectedColorValue}>{selectedVariant.color.ru}</span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className={styles.actionButtons}>
            <Button
              onClick={handleAddToCart}
              className={`${styles.cartButton} ${isVariantInCart ? styles.inCartButton : ""}`}
              disabled={!selectedVariant}
            >
              <ShoppingCart size={18} />
              <span>{isVariantInCart ? "В корзине" : "В корзину"}</span>
            </Button>

            <Button
              onClick={handleToggleFavorite}
              variant="outline"
              className={`${styles.favoriteButton} ${isVariantInFavorites ? styles.inFavoritesButton : ""}`}
              disabled={!selectedVariant}
            >
              <Heart
                size={18}
                className={isVariantInFavorites ? styles.filledHeart : ""}
                fill={isVariantInFavorites ? "currentColor" : "none"}
              />
              <span>{isVariantInFavorites ? "В избранном" : "В избранное"}</span>
            </Button>
          </div>

          {/* Success message */}
          {showSuccessMessage && (
            <div className={styles.successMessage}>
              <Check size={16} className={styles.successIcon} />
              <span>{showSuccessMessage}</span>
            </div>
          )}

          {/* Fabric information tabs */}
          <Tabs defaultValue="description" className={styles.infoTabs}>
            <TabsList className={styles.tabsList}>
              <TabsTrigger value="description">Описание</TabsTrigger>
              <TabsTrigger value="specifications">Характеристики</TabsTrigger>
              <TabsTrigger value="care">Уход</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className={styles.tabContent}>
              {collection.description_ru ? (
                <p className={styles.descriptionText}>{collection.description_ru}</p>
              ) : (
                <p className={styles.descriptionText}>
                  {collection.name_ru} - это высококачественная ткань из категории {category.name_ru}. Идеально подходит
                  для обивки мебели и создания уютного интерьера.
                </p>
              )}

              {collection.technicalSpecifications?.applicationAreas_ru && (
                <div className={styles.applicationAreas}>
                  <h4 className={styles.applicationAreasTitle}>Области применения:</h4>
                  <ul className={styles.applicationAreasList}>
                    {collection.technicalSpecifications.applicationAreas_ru.map((area, index) => (
                      <li key={index} className={styles.applicationArea}>
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="specifications" className={styles.tabContent}>
              {collection.technicalSpecifications ? (
                <div className={styles.specificationsTable}>
                  {Object.entries(collection.technicalSpecifications).map(([key, value]) => {
                    // Skip application areas as they're arrays and null values
                    if (key === "applicationAreas_ru" || !value) return null

                    // Format the key for display
                    let displayKey = key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/_ru$/, "")
                      .replace(/^./, (str) => str.toUpperCase())

                    // Map technical specification keys to Russian
                    const keyMapping: Record<string, string> = {
                      "Fabric Type": "Тип ткани",
                      "Abrasion Resistance": "Устойчивость к истиранию",
                      Density: "Плотность",
                      Composition: "Состав",
                      Width: "Ширина",
                      Origin: "Страна производства",
                      "Collection Name": "Название коллекции",
                      Directionality: "Направленность рисунка",
                    }

                    displayKey = keyMapping[displayKey] || displayKey

                    return (
                      <div key={key} className={styles.specificationRow}>
                        <div className={styles.specificationKey}>{displayKey}</div>
                        <div className={styles.specificationValue}>{value}</div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className={styles.noSpecifications}>Технические характеристики не указаны.</p>
              )}
            </TabsContent>

            <TabsContent value="care" className={styles.tabContent}>
              {collection.careInstructions_ru && collection.careInstructions_ru.length > 0 ? (
                <ul className={styles.careInstructionsList}>
                  {collection.careInstructions_ru.map((instruction, index) => (
                    <li key={index} className={styles.careInstruction}>
                      {instruction}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.noCareInstructions}>Информация по уходу не предоставлена.</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Similar fabrics section */}
      {similarCollections.length > 0 && (
        <div className={styles.similarFabricsSection}>
          <h2 className={styles.similarFabricsTitle}>Похожие ткани</h2>
          <div className={styles.similarFabricsGrid}>
            {similarCollections.map((similarCollection) => (
              <FabricCollectionCard
                key={similarCollection.name}
                categoryName={categoryId}
                collection={similarCollection}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
