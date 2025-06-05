"use client"

import { useState } from "react"
import styles from "./FabricSort.module.css"

interface FabricSortProps {
  onSort: (sortOption: string) => void
  className?: string
}

export const FabricSort = ({ onSort, className = "" }: FabricSortProps) => {
  const [activeSortOption, setActiveSortOption] = useState<string>("default")

  const sortOptions = [
    { value: "default", label: "По умолчанию" },
    { value: "name-asc", label: "По названию (А-Я)" },
    { value: "name-desc", label: "По названию (Я-А)" },
    { value: "newest", label: "Сначала новые" },
    { value: "popularity", label: "По популярности" },
  ]

  const handleSortChange = (option: string) => {
    setActiveSortOption(option)
    onSort(option)
  }

  return (
    <div className={`${styles.sortContainer} ${className}`}>
      <div className={styles.sortLabel}>Сортировать:</div>
      <div className={styles.sortOptions}>
        {sortOptions.map((option) => (
          <button
            key={option.value}
            className={`${styles.sortOption} ${activeSortOption === option.value ? styles.active : ""}`}
            onClick={() => handleSortChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className={styles.sortDropdown}>
        <select
          value={activeSortOption}
          onChange={(e) => handleSortChange(e.target.value)}
          className={styles.sortSelect}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          className={styles.sortDropdownIcon}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

export default FabricSort
