"use client"

import { useState } from "react"
import Image from "next/image"
import { useFabricCart } from "@/entities/fabric-cart/model/fabricCartContext"
import { useFabricFavorites } from "@/entities/fabric-favorites/model/fabricFavoritesContext"
import Button from "@/shared/ui/button/Button"
import type { FabricCategory, FabricCollection, FabricVariant } from "@/shared/api/types"
import styles from "./FabricCollectionClient.module.css"

interface FabricCollectionClientProps {
  category: FabricCategory
  collection: FabricCollection
  categoryId: string
  collectionId: string
}

export default function FabricCollectionClient({
  category,
  collection,
  categoryId,
  collectionId,
}: FabricCollectionClientProps) {
  const { state: cartState, dispatch: cartDispatch } = useFabricCart()
  const { state: favoritesState, dispatch: favoritesDispatch } = useFabricFavorites()
  const [activeTab, setActiveTab] = useState<"description" | "specifications" | "care">("description")

  // Проверка наличия варианта в корзине и избранном
  const isInCart = (variantId: number) => {
    const id = `${categoryId}-${collectionId}-${variantId}`
    return cartState.items.some((item) => item.id === id)
  }

  const isInFavorites = (variantId: number) => {
    const id = `${categoryId}-${collectionId}-${variantId}`
    return favoritesState.items.some((item) => item.id === id)
  }

  // Обработчики добавления в корзину и избранное
  const handleAddToCart = (variant: FabricVariant) => {
    const variantId = `${categoryId}-${collectionId}-${variant.id}`

    if (isInCart(variant.id)) return

    cartDispatch({
      type: "ADD_TO_CART",
      payload: {
        id: variantId,
        categoryName: categoryId,
        categoryNameRu: category.name_ru,
        collectionName: collectionId,
        collectionNameRu: collection.name_ru,
        variant,
        quantity: 1,
        price: 1200, // Фиксированная цена для примера
      },
    })
  }

  const handleToggleFavorite = (variant: FabricVariant) => {
    const variantId = `${categoryId}-${collectionId}-${variant.id}`

    if (isInFavorites(variant.id)) {
      favoritesDispatch({
        type: "REMOVE_FROM_FAVORITES",
        payload: variantId,
      })
    } else {
      favoritesDispatch({
        type: "ADD_TO_FAVORITES",
        payload: {
          id: variantId,
          categoryName: categoryId,
          categoryNameRu: category.name_ru,
          collectionName: collectionId,
          collectionNameRu: collection.name_ru,
          variant,
        },
      })
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{collection.name_ru}</h1>
        <div className={styles.availability}>{collection.availability}</div>
      </div>

      <div className={styles.content}>
        <div className={styles.variantsSection}>
          <h2 className={styles.sectionTitle}>Доступные цвета</h2>
          <div className={styles.variantsGrid}>
            {collection.variants.map((variant) => (
              <div key={variant.id} className={styles.variantCard}>
                <div className={styles.imageContainer}>
                  <Image
                    src={variant.image || `/placeholder.svg?height=300&width=300&query=${variant.color.ru}%20fabric`}
                    alt={variant.color.ru}
                    width={300}
                    height={300}
                    className={styles.variantImage}
                  />
                  <div className={styles.variantActions}>
                    <Button
                      variant={isInCart(variant.id) ? "secondary" : "primary"}
                      size="sm"
                      onClick={() => handleAddToCart(variant)}
                      className={styles.actionButton}
                    >
                      {isInCart(variant.id) ? "В корзине" : "В корзину"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleFavorite(variant)}
                      className={`${styles.favoriteButton} ${isInFavorites(variant.id) ? styles.favoriteActive : ""}`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill={isInFavorites(variant.id) ? "currentColor" : "none"}
                        />
                      </svg>
                    </Button>
                  </div>
                </div>
                <div className={styles.variantInfo}>
                  <h3 className={styles.variantTitle}>{variant.color.ru}</h3>
                  <p className={styles.variantPrice}>1200 ₽/м</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.detailsSection}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === "description" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("description")}
            >
              Описание
            </button>
            <button
              className={`${styles.tab} ${activeTab === "specifications" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("specifications")}
            >
              Характеристики
            </button>
            <button
              className={`${styles.tab} ${activeTab === "care" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("care")}
            >
              Уход
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === "description" && (
              <div className={styles.description}>
                {collection.description_ru ? (
                  <p>{collection.description_ru}</p>
                ) : (
                  <p>
                    Коллекция {collection.name_ru} из категории {category.name_ru}. Идеально подходит для обивки мебели
                    и создания уютного интерьера.
                  </p>
                )}
              </div>
            )}

            {activeTab === "specifications" && (
              <div className={styles.specifications}>
                <h3>Технические характеристики</h3>
                <table className={styles.specTable}>
                  <tbody>
                    {collection.technicalSpecifications && (
                      <>
                        {collection.technicalSpecifications.fabricType && (
                          <tr>
                            <td>Тип ткани:</td>
                            <td>{collection.technicalSpecifications.fabricType}</td>
                          </tr>
                        )}
                        {collection.technicalSpecifications.abrasionResistance && (
                          <tr>
                            <td>Устойчивость к истиранию:</td>
                            <td>{collection.technicalSpecifications.abrasionResistance} циклов</td>
                          </tr>
                        )}
                        {collection.technicalSpecifications.density && (
                          <tr>
                            <td>Плотность:</td>
                            <td>{collection.technicalSpecifications.density}</td>
                          </tr>
                        )}
                        {collection.technicalSpecifications.composition_ru && (
                          <tr>
                            <td>Состав:</td>
                            <td>{collection.technicalSpecifications.composition_ru}</td>
                          </tr>
                        )}
                        {collection.technicalSpecifications.width && (
                          <tr>
                            <td>Ширина:</td>
                            <td>{collection.technicalSpecifications.width}</td>
                          </tr>
                        )}
                        {collection.technicalSpecifications.origin_ru && (
                          <tr>
                            <td>Страна производства:</td>
                            <td>{collection.technicalSpecifications.origin_ru}</td>
                          </tr>
                        )}
                        {collection.technicalSpecifications.directionality_ru && (
                          <tr>
                            <td>Направленность:</td>
                            <td>{collection.technicalSpecifications.directionality_ru}</td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "care" && (
              <div className={styles.care}>
                <h3>Инструкции по уходу</h3>
                {collection.careInstructions_ru && collection.careInstructions_ru.length > 0 ? (
                  <ul className={styles.careList}>
                    {collection.careInstructions_ru.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Информация по уходу не предоставлена.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
