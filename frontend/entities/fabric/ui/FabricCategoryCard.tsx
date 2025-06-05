import Link from "next/link"
import Image from "next/image"
import styles from "./FabricCategoryCard.module.css"
import type { FabricCategory } from "@/shared/api/types"

interface FabricCategoryCardProps {
  category: FabricCategory
  className?: string
}

export const FabricCategoryCard = ({ category, className = "" }: FabricCategoryCardProps) => {
  // Получаем первое изображение из первой коллекции для превью категории
  const previewImage = category.collections[0]?.variants[0]?.image || "/assorted-fabrics.png"

  return (
    <Link href={`/fabrics/${category.name.toLowerCase()}`} className={`${styles.card} ${className}`}>
      <div className={styles.imageContainer}>
        <Image
          src={previewImage || "/placeholder.svg"}
          alt={category.name_ru}
          width={300}
          height={300}
          className={styles.image}
        />
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{category.name_ru}</h3>
        {category.description_ru && <p className={styles.description}>{category.description_ru}</p>}
        <div className={styles.collectionsCount}>
          {category.collections.length} {getCollectionsText(category.collections.length)}
        </div>
      </div>
    </Link>
  )
}

// Функция для правильного склонения слова "коллекция"
function getCollectionsText(count: number): string {
  const lastDigit = count % 10
  const lastTwoDigits = count % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return "коллекций"
  }

  if (lastDigit === 1) {
    return "коллекция"
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return "коллекции"
  }

  return "коллекций"
}

export default FabricCategoryCard
