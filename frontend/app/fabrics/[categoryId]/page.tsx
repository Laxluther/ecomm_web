import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  getFabricCategoryByName,
  filterFabricCollections,
  getFabricTypes,
  getFabricCollectionNames,
  getFabricAvailabilities,
} from "@/shared/api/fabric-api"
import FabricCollectionCard from "@/entities/fabric/ui/FabricCollectionCard"
import FabricFiltersDrawer from "@/features/fabric-filters/ui/FabricFiltersDrawer"
import Breadcrumbs from "@/shared/ui/breadcrumbs/Breadcrumbs"
import styles from "./page.module.css"

interface FabricCategoryPageProps {
  params: {
    categoryId: string
  }
  searchParams: {
    collections?: string
    types?: string
    minAbrasion?: string
    maxAbrasion?: string
    availability?: string
  }
}

export async function generateMetadata({ params }: FabricCategoryPageProps): Promise<Metadata> {
  const category = await getFabricCategoryByName(params.categoryId)

  if (!category) {
    return {
      title: "Категория не найдена",
      description: "Запрашиваемая категория тканей не найдена",
    }
  }

  return {
    title: `${category.name_ru} - Ткани для мебели`,
    description: category.description_ru || `Коллекции тканей ${category.name_ru} для мебели`,
  }
}

export default async function FabricCategoryPage({ params, searchParams }: FabricCategoryPageProps) {
  const category = await getFabricCategoryByName(params.categoryId)

  if (!category) {
    notFound()
  }

  // Получаем уникальные значения для фильтров
  const collectionNames = await getFabricCollectionNames(params.categoryId)
  const types = await getFabricTypes(params.categoryId)
  const availabilities = await getFabricAvailabilities(params.categoryId)

  // Преобразуем параметры запроса в массивы для фильтрации
  const collectionsFilter = searchParams.collections ? searchParams.collections.split(",") : undefined
  const typesFilter = searchParams.types ? searchParams.types.split(",") : undefined
  const minAbrasionFilter = searchParams.minAbrasion ? Number(searchParams.minAbrasion) : undefined
  const maxAbrasionFilter = searchParams.maxAbrasion ? Number(searchParams.maxAbrasion) : undefined
  const availabilityFilter = searchParams.availability ? searchParams.availability.split(",") : undefined

  // Получаем коллекции с учетом фильтров
  const collections = await filterFabricCollections(params.categoryId, {
    collections: collectionsFilter,
    types: typesFilter,
    minAbrasion: minAbrasionFilter,
    maxAbrasion: maxAbrasionFilter,
    availability: availabilityFilter,
  })

  // Формируем хлебные крошки
  const breadcrumbItems = [
    { label: "Главная", href: "/" },
    { label: "Ткани", href: "/fabrics" },
    { label: category.name_ru, href: `/fabrics/${params.categoryId}`, isCurrent: true },
  ]

  return (
    <div className="container">
      <Breadcrumbs items={breadcrumbItems} />

      <h1 className={styles.title}>{category.name_ru}</h1>

      {category.description_ru && <p className={styles.description}>{category.description_ru}</p>}

      <div className={styles.toolsContainer}>
        <FabricFiltersDrawer collections={collectionNames} types={types} availabilities={availabilities} />

        <div className={styles.resultsCount}>Найдено: {collections.length}</div>
      </div>

      {collections.length > 0 ? (
        <div className={styles.collectionsGrid}>
          {collections.map((collection) => (
            <FabricCollectionCard key={collection.name} categoryName={params.categoryId} collection={collection} />
          ))}
        </div>
      ) : (
        <div className={styles.noCollections}>
          <p>По вашему запросу ничего не найдено. Попробуйте изменить параметры фильтрации.</p>
        </div>
      )}
    </div>
  )
}
