"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Button from "@/shared/ui/button/Button"
import Input from "@/shared/ui/input/Input"
import styles from "./FabricFiltersDrawer.module.css"

interface FabricFiltersDrawerProps {
  collections?: string[]
  types?: string[]
  availabilities?: string[]
  categoryId?: string
  className?: string
}

export const FabricFiltersDrawer = ({
  collections = [],
  types = [],
  availabilities = [],
  categoryId,
  className = "",
}: FabricFiltersDrawerProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Получаем начальные значения из URL
  const initialCollections = searchParams.get("collections")?.split(",") || []
  const initialTypes = searchParams.get("types")?.split(",") || []
  const initialMinAbrasion = searchParams.get("minAbrasion") ? Number(searchParams.get("minAbrasion")) : 0
  const initialMaxAbrasion = searchParams.get("maxAbrasion") ? Number(searchParams.get("maxAbrasion")) : 100000
  const initialAvailabilities = searchParams.get("availability")?.split(",") || []

  // Состояние фильтров
  const [selectedCollections, setSelectedCollections] = useState<string[]>(initialCollections)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(initialTypes)
  const [minAbrasion, setMinAbrasion] = useState<number>(initialMinAbrasion)
  const [maxAbrasion, setMaxAbrasion] = useState<number>(initialMaxAbrasion)
  const [selectedAvailabilities, setSelectedAvailabilities] = useState<string[]>(initialAvailabilities)
  const [filtersChanged, setFiltersChanged] = useState(false)

  // Добавить новое состояние для хранения количества коллекций, соответствующих фильтрам
  const [filteredCount, setFilteredCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Закрытие drawer при клике вне его области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && drawerRef.current && overlayRef.current && event.target === overlayRef.current) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Блокировка прокрутки body при открытом drawer
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Обработчики изменения фильтров
  const handleCollectionChange = (collection: string, checked: boolean) => {
    setSelectedCollections((prev) => {
      const newValue = checked ? [...prev, collection] : prev.filter((c) => c !== collection)
      setFiltersChanged(true)
      return newValue
    })
  }

  const handleTypeChange = (type: string, checked: boolean) => {
    setSelectedTypes((prev) => {
      const newValue = checked ? [...prev, type] : prev.filter((t) => t !== type)
      setFiltersChanged(true)
      return newValue
    })
  }

  const handleMinAbrasionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? Number(e.target.value) : 0
    setMinAbrasion(value)
    setFiltersChanged(true)
  }

  const handleMaxAbrasionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? Number(e.target.value) : 100000
    setMaxAbrasion(value)
    setFiltersChanged(true)
  }

  const handleAvailabilityChange = (availability: string, checked: boolean) => {
    setSelectedAvailabilities((prev) => {
      const newValue = checked ? [...prev, availability] : prev.filter((a) => a !== availability)
      setFiltersChanged(true)
      return newValue
    })
  }

  // Определение категории из URL или пропса
  const getCategoryFromPath = (): string | null => {
    // Если категория передана как проп, используем её
    if (categoryId) {
      return categoryId
    }

    // Иначе пытаемся извлечь из URL
    try {
      const pathParts = pathname.split("/")
      // URL может быть /fabrics/[categoryId] или /fabrics/[categoryId]/[collectionId]
      if (pathParts.length >= 3 && pathParts[1] === "fabrics") {
        return pathParts[2]
      }
    } catch (error) {
      console.error("Error extracting category from path:", error)
    }

    return null
  }

  // Добавить функцию для предварительной проверки количества коллекций
  const checkFilteredCount = async () => {
    try {
      setIsLoading(true)

      // Получаем категорию
      const category = getCategoryFromPath()

      if (!category) {
        console.error("Category not found")
        setFilteredCount(null)
        setIsLoading(false)
        return
      }

      const params = new URLSearchParams()

      if (selectedCollections.length > 0) {
        params.set("collections", selectedCollections.join(","))
      }

      if (selectedTypes.length > 0) {
        params.set("types", selectedTypes.join(","))
      }

      if (minAbrasion > 0) {
        params.set("minAbrasion", minAbrasion.toString())
      }

      if (maxAbrasion < 100000) {
        params.set("maxAbrasion", maxAbrasion.toString())
      }

      if (selectedAvailabilities.length > 0) {
        params.set("availability", selectedAvailabilities.join(","))
      }

      // Вызываем API для получения отфильтрованных коллекций
      const response = await fetch(`/api/check-fabric-filters?category=${category}&${params.toString()}`)

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()

      // Проверяем, что data - это массив
      if (Array.isArray(data)) {
        setFilteredCount(data.length)
      } else if (data && typeof data === "object" && data.error) {
        console.error("API returned error:", data.error)
        setFilteredCount(null)
      } else {
        console.error("API response is not an array:", data)
        setFilteredCount(null)
      }
    } catch (error) {
      console.error("Error checking filtered count:", error)
      setFilteredCount(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Добавить вызов функции при изменении фильтров
  useEffect(() => {
    if (filtersChanged) {
      const timer = setTimeout(() => {
        checkFilteredCount()
      }, 300) // Добавляем небольшую задержку для дебаунсинга

      return () => clearTimeout(timer)
    } else {
      setFilteredCount(null)
    }
  }, [selectedCollections, selectedTypes, minAbrasion, maxAbrasion, selectedAvailabilities, filtersChanged, pathname])

  // Применение фильтров
  const applyFilters = () => {
    const params = new URLSearchParams()

    if (selectedCollections.length > 0) {
      params.set("collections", selectedCollections.join(","))
    }

    if (selectedTypes.length > 0) {
      params.set("types", selectedTypes.join(","))
    }

    if (minAbrasion > 0) {
      params.set("minAbrasion", minAbrasion.toString())
    }

    if (maxAbrasion < 100000) {
      params.set("maxAbrasion", maxAbrasion.toString())
    }

    if (selectedAvailabilities.length > 0) {
      params.set("availability", selectedAvailabilities.join(","))
    }

    router.push(`${pathname}?${params.toString()}`)
    setIsOpen(false)
    setFiltersChanged(false)
  }

  // Сброс фильтров
  const resetFilters = () => {
    setSelectedCollections([])
    setSelectedTypes([])
    setMinAbrasion(0)
    setMaxAbrasion(100000)
    setSelectedAvailabilities([])
    setFiltersChanged(true)
  }

  // Переключение состояния drawer
  const toggleDrawer = () => {
    setIsOpen(!isOpen)

    // При открытии фильтров, сбрасываем флаг изменений
    if (!isOpen) {
      setFiltersChanged(false)
    }
  }

  // Проверяем, есть ли хоть один фильтр для отображения
  const hasFilters =
    (collections && collections.length > 0) ||
    (types && types.length > 0) ||
    (availabilities && availabilities.length > 0)

  if (!hasFilters) {
    // Если нет фильтров для отображения, возвращаем пустой фрагмент или упрощенную версию
    return (
      <div className={`${styles.filtersContainer} ${className}`}>
        <div className={styles.filtersHeader}>
          <button className={styles.filterButton} onClick={() => {}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3 6H21M10 12H21M17 18H21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Фильтры недоступны
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.filtersContainer} ${className}`}>
      <div className={styles.filtersHeader}>
        <button className={styles.filterButton} onClick={toggleDrawer}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3 6H21M10 12H21M17 18H21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Фильтры
        </button>
      </div>

      {/* Overlay */}
      <div
        ref={overlayRef}
        className={`${styles.overlay} ${isOpen ? styles.active : ""}`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Drawer */}
      <div ref={drawerRef} className={`${styles.drawer} ${isOpen ? styles.open : ""}`}>
        <div className={styles.drawerHeader}>
          <h2 className={styles.drawerTitle}>Фильтры</h2>
          <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className={styles.drawerContent}>
          {collections && collections.length > 0 && (
            <div className={styles.filterGroup}>
              <h3 className={styles.filterGroupTitle}>Коллекция</h3>
              <div className={styles.filterOptions}>
                {collections.map((collection) => (
                  <label key={collection} className={styles.filterOption}>
                    <input
                      type="checkbox"
                      checked={selectedCollections.includes(collection)}
                      onChange={(e) => handleCollectionChange(collection, e.target.checked)}
                      className={styles.filterInput}
                    />
                    <span className={styles.filterLabel}>{collection}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {types && types.length > 0 && (
            <div className={styles.filterGroup}>
              <h3 className={styles.filterGroupTitle}>Тип ткани</h3>
              <div className={styles.filterOptions}>
                {types.map((type) => (
                  <label key={type} className={styles.filterOption}>
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type)}
                      onChange={(e) => handleTypeChange(type, e.target.checked)}
                      className={styles.filterInput}
                    />
                    <span className={styles.filterLabel}>{type}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className={styles.filterGroup}>
            <h3 className={styles.filterGroupTitle}>Устойчивость к истиранию (циклов)</h3>
            <div className={styles.abrasionInputs}>
              <div className={styles.abrasionInputGroup}>
                <label htmlFor="min-abrasion" className={styles.abrasionLabel}>
                  От:
                </label>
                <Input
                  id="min-abrasion"
                  type="number"
                  placeholder="От"
                  className={styles.abrasionInput}
                  value={minAbrasion.toString()}
                  onChange={handleMinAbrasionChange}
                  min={0}
                  max={maxAbrasion}
                />
              </div>
              <div className={styles.abrasionInputGroup}>
                <label htmlFor="max-abrasion" className={styles.abrasionLabel}>
                  До:
                </label>
                <Input
                  id="max-abrasion"
                  type="number"
                  placeholder="До"
                  className={styles.abrasionInput}
                  value={maxAbrasion.toString()}
                  onChange={handleMaxAbrasionChange}
                  min={minAbrasion}
                />
              </div>
            </div>
          </div>

          {availabilities && availabilities.length > 0 && (
            <div className={styles.filterGroup}>
              <h3 className={styles.filterGroupTitle}>Наличие</h3>
              <div className={styles.filterOptions}>
                {availabilities.map((availability) => (
                  <label key={availability} className={styles.filterOption}>
                    <input
                      type="checkbox"
                      checked={selectedAvailabilities.includes(availability)}
                      onChange={(e) => handleAvailabilityChange(availability, e.target.checked)}
                      className={styles.filterInput}
                    />
                    <span className={styles.filterLabel}>{availability}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className={styles.filterActions}>
            <Button variant="outline" size="sm" onClick={resetFilters} className={styles.resetButton}>
              Сбросить
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={applyFilters}
              className={styles.applyButton}
              disabled={!filtersChanged}
            >
              {isLoading ? "Загрузка..." : <>Применить {filteredCount !== null ? `(${filteredCount})` : ""}</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FabricFiltersDrawer
