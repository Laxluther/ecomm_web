import type { Metadata } from "next"
import { getFabricCategories } from "@/shared/api/fabric-api"
import FabricCategoryCard from "@/entities/fabric/ui/FabricCategoryCard"
import FabricInfo from "@/widgets/fabric-info/ui/FabricInfo"
import styles from "./page.module.css"

export const metadata: Metadata = {
  title: "Ткани для мебели",
  description: "Широкий выбор тканей для мебели: велюр, шенилл и другие. Выбирайте ткани для вашей мебели.",
}

export default async function FabricsPage() {
  const categories = await getFabricCategories()

  return (
    <div className="container">
      <h1 className={styles.title}>Ткани для мебели</h1>
      <p className={styles.description}>
        Выберите категорию ткани, чтобы просмотреть доступные коллекции и варианты. Мы предлагаем широкий выбор
        качественных тканей для вашей мебели.
      </p>

      {categories.length > 0 ? (
        <div className={styles.categoriesGrid}>
          {categories.map((category) => (
            <FabricCategoryCard key={category.name} category={category} />
          ))}
        </div>
      ) : (
        <div className={styles.noCategories}>
          <p>В данный момент категории тканей недоступны. Пожалуйста, попробуйте позже.</p>
        </div>
      )}

      <FabricInfo />
    </div>
  )
}
