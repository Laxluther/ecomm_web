"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import type { FabricCollection } from "@/shared/api/types"
import styles from "./FabricCollectionCard.module.css"

interface FabricCollectionCardProps {
  categoryName: string // Changed from category object to just the category name
  collection: FabricCollection
  className?: string
}

export const FabricCollectionCard = ({ categoryName, collection, className = "" }: FabricCollectionCardProps) => {
  const [isHovered, setIsHovered] = useState(false)

  // Safely access collection properties with fallbacks
  const collectionNameRu = collection?.name_ru || "Коллекция"
  const collectionName = collection?.name || ""
  const collectionType = collection?.type || ""
  const collectionAvailability = collection?.availability || ""

  // Get the first variant image as the collection thumbnail
  const thumbnailImage =
    collection?.variants && collection.variants.length > 0
      ? collection.variants[0].image
      : `/placeholder.svg?height=300&width=300&query=${collectionNameRu}%20fabric`

  return (
    <Link
      href={`/fabrics/${categoryName.toLowerCase()}/${encodeURIComponent(collectionName)}`}
      className={`${styles.card} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.imageContainer}>
        <Image
          src={thumbnailImage || "/placeholder.svg?height=300&width=300&query=fabric"}
          alt={collectionNameRu}
          width={300}
          height={300}
          className={styles.image}
        />
        <div className={`${styles.overlay} ${isHovered ? styles.visible : ""}`}>
          <span className={styles.viewDetails}>Посмотреть детали</span>
        </div>
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{collectionNameRu}</h3>
        <div className={styles.type}>{collectionType}</div>
        <div className={styles.availability}>{collectionAvailability}</div>
      </div>
    </Link>
  )
}

export default FabricCollectionCard
