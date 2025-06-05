"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useFavorites } from "@/entities/favorites/model/favoritesContext"
import { useFabricFavorites } from "@/entities/fabric-favorites/model/fabricFavoritesContext"
import ProductCard from "@/entities/product/ui/ProductCard"
import FabricCard from "@/entities/fabric/ui/FabricCard"
import Button from "@/shared/ui/button/Button"
import styles from "./page.module.css"

export default function FavoritesPage() {
  const { state: furnitureFavoritesState, dispatch: furnitureFavoritesDispatch } = useFavorites()
  const { state: fabricFavoritesState, dispatch: fabricFavoritesDispatch } = useFabricFavorites()
  const [isClient, setIsClient] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "furniture" | "fabrics">("all")

  // Fix hydration issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  // Безопасно получаем массивы избранного
  const furnitureFavorites = furnitureFavoritesState?.items || []
  const fabricFavorites = fabricFavoritesState?.items || []

  // Проверяем, пуст ли список избранного
  const isEmptyFavorites = furnitureFavorites.length === 0 && fabricFavorites.length === 0

  // Проверяем, есть ли товары в каждой категории
  const hasFurniture = furnitureFavorites.length > 0
  const hasFabrics = fabricFavorites.length > 0

  // Определяем, какие товары показывать в зависимости от активного таба
  const showFurniture = activeTab === "all" || activeTab === "furniture"
  const showFabrics = activeTab === "all" || activeTab === "fabrics"

  // Функция для удаления мебели из избранного
  const removeFromFurnitureFavorites = (id: string) => {
    furnitureFavoritesDispatch({
      type: "REMOVE_FROM_FAVORITES",
      payload: id,
    })
  }

  // Функция для удаления ткани из избранного
  const removeFromFabricFavorites = (id: string) => {
    fabricFavoritesDispatch({
      type: "REMOVE_FROM_FAVORITES",
      payload: id,
    })
  }

  return (
    <div className="container">
      <h1 className={styles.title}>Избранное</h1>

      {isEmptyFavorites ? (
        <div className={styles.emptyFavorites}>
          <div className={styles.emptyFavoritesIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </div>
          <h2 className={styles.emptyFavoritesTitle}>У вас нет избранных товаров</h2>
          <p className={styles.emptyFavoritesText}>
            Добавьте товары в избранное, чтобы вернуться к ним позже или сравнить
          </p>
          <div className={styles.emptyFavoritesActions}>
            <Link href="/catalog">
              <Button size="lg">Перейти в каталог мебели</Button>
            </Link>
            <Link href="/fabrics">
              <Button variant="outline" size="lg">
                Перейти к тканям
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.favoritesContent}>
          {/* Табы для переключения между категориями */}
          <div className={styles.favoritesTabs}>
            <button
              className={`${styles.favoritesTab} ${activeTab === "all" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("all")}
            >
              Все товары ({furnitureFavorites.length + fabricFavorites.length})
            </button>
            {hasFurniture && (
              <button
                className={`${styles.favoritesTab} ${activeTab === "furniture" ? styles.activeTab : ""}`}
                onClick={() => setActiveTab("furniture")}
              >
                Мебель ({furnitureFavorites.length})
              </button>
            )}
            {hasFabrics && (
              <button
                className={`${styles.favoritesTab} ${activeTab === "fabrics" ? styles.activeTab : ""}`}
                onClick={() => setActiveTab("fabrics")}
              >
                Ткани ({fabricFavorites.length})
              </button>
            )}
          </div>

          {/* Секция мебели */}
          {showFurniture && hasFurniture && (
            <div className={styles.favoritesSection}>
              {activeTab !== "all" && <h2 className={styles.sectionTitle}>Мебель</h2>}
              <div className={styles.furnitureGrid}>
                {furnitureFavorites.map((item) => (
                  <ProductCard key={item.id} product={item.product} showOptions={true} />
                ))}
              </div>
            </div>
          )}

          {/* Секция тканей */}
          {showFabrics && hasFabrics && (
            <div className={styles.favoritesSection}>
              {activeTab !== "all" && <h2 className={styles.sectionTitle}>Ткани</h2>}
              <div className={styles.fabricsGrid}>
                {fabricFavorites.map((item) => (
                  <FabricCard
                    key={item.id}
                    categoryName={item.categoryName}
                    categoryNameRu={item.categoryNameRu}
                    collectionName={item.collectionName}
                    collectionNameRu={item.collectionNameRu}
                    variant={item.variant}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
