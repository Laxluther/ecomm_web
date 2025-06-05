"use client"

import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Button from "@/shared/ui/button/Button"
import styles from "./FabricFilters.module.css"

interface FabricFiltersClientProps {
  collections: string[]
  types: string[]
  abrasionResistances: string[]
  availabilities: string[]
  className?: string
}

export const FabricFiltersClient = ({
  collections,
  types,
  abrasionResistances,
  availabilities,
  className = "",
}: FabricFiltersClientProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Получаем начальные значения из URL
  const initialCollections = searchParams.get("collections")?.split(",") || []
  const initialTypes = searchParams.get("types")?.split(",") || []
  const initialAbrasion = searchParams.get("abrasion")?.split(",") || []
  const initialAvailability = searchParams.get("availability")?.split(",") || []

  // Состояние фильтров с начальными значениями из URL
  const [selectedCollections, setSelectedCollections] = useState<string[]>(initialCollections)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(initialTypes)
  const [selectedAbrasionResistances, setSelectedAbrasionResistances] = useState<string[]>(initialAbrasion)
  const [selectedAvailabilities, setSelectedAvailabilities] = useState<string[]>(initialAvailability)

  // Обработчики изменения фильтров
  const handleCollectionChange = (collection: string, checked: boolean) => {
    setSelectedCollections((prev) => (checked ? [...prev, collection] : prev.filter((c) => c !== collection)))
  }

  const handleTypeChange = (type: string, checked: boolean) => {
    setSelectedTypes((prev) => (checked ? [...prev, type] : prev.filter((t) => t !== type)))
  }

  const handleAbrasionChange = (abrasion: string, checked: boolean) => {
    setSelectedAbrasionResistances((prev) => (checked ? [...prev, abrasion] : prev.filter((a) => a !== abrasion)))
  }

  const handleAvailabilityChange = (availability: string, checked: boolean) => {
    setSelectedAvailabilities((prev) => (checked ? [...prev, availability] : prev.filter((a) => a !== availability)))
  }

  // Применение фильтров
  const applyFilters = () => {
    const params = new URLSearchParams()

    if (selectedCollections.length > 0) {
      params.set("collections", selectedCollections.join(","))
    }

    if (selectedTypes.length > 0) {
      params.set("types", selectedTypes.join(","))
    }

    if (selectedAbrasionResistances.length > 0) {
      params.set("abrasion", selectedAbrasionResistances.join(","))
    }

    if (selectedAvailabilities.length > 0) {
      params.set("availability", selectedAvailabilities.join(","))
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  // Сброс фильтров
  const resetFilters = () => {
    setSelectedCollections([])
    setSelectedTypes([])
    setSelectedAbrasionResistances([])
    setSelectedAvailabilities([])
    router.push(pathname)
  }

  return (
    <div className={`${styles.filtersContainer} ${className}`}>
      <h2 className={styles.filtersTitle}>Фильтры</h2>

      {collections.length > 0 && (
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

      {types.length > 0 && (
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

      {abrasionResistances.length > 0 && (
        <div className={styles.filterGroup}>
          <h3 className={styles.filterGroupTitle}>Устойчивость к истиранию</h3>
          <div className={styles.filterOptions}>
            {abrasionResistances.map((abrasion) => (
              <label key={abrasion} className={styles.filterOption}>
                <input
                  type="checkbox"
                  checked={selectedAbrasionResistances.includes(abrasion)}
                  onChange={(e) => handleAbrasionChange(abrasion, e.target.checked)}
                  className={styles.filterInput}
                />
                <span className={styles.filterLabel}>{abrasion}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {availabilities.length > 0 && (
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
        <Button variant="outline" onClick={resetFilters} className={styles.resetButton}>
          Сбросить
        </Button>
        <Button variant="primary" onClick={applyFilters} className={styles.applyButton}>
          Применить
        </Button>
      </div>
    </div>
  )
}

export default FabricFiltersClient
