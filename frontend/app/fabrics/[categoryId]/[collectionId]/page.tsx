import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getFabricCategoryByName, getFabricCollection, getAllFabricCollections } from "@/shared/api/fabric-api"
import Breadcrumbs from "@/shared/ui/breadcrumbs/Breadcrumbs"
import FabricDetail from "@/widgets/fabric-detail/ui/FabricDetail"

interface FabricCollectionPageProps {
  params: {
    categoryId: string
    collectionId: string
  }
}

export async function generateMetadata({ params }: FabricCollectionPageProps): Promise<Metadata> {
  const collection = await getFabricCollection(params.categoryId, params.collectionId)

  if (!collection) {
    return {
      title: "Коллекция не найдена",
      description: "Запрашиваемая коллекция тканей не найдена",
    }
  }

  return {
    title: `${collection.name_ru} - Коллекция тканей`,
    description: collection.description_ru || `Коллекция тканей ${collection.name_ru}`,
  }
}

export default async function FabricCollectionPage({ params }: FabricCollectionPageProps) {
  const category = await getFabricCategoryByName(params.categoryId)
  const collection = await getFabricCollection(params.categoryId, params.collectionId)

  if (!category || !collection) {
    notFound()
  }

  // Получаем другие коллекции из той же категории для секции "Похожие ткани"
  const allCollections = await getAllFabricCollections(params.categoryId)
  const similarCollections = allCollections.filter((c) => c.name !== collection.name).slice(0, 4) // Ограничиваем до 4 похожих коллекций

  // Формируем хлебные крошки
  const breadcrumbItems = [
    { label: "Главная", href: "/" },
    { label: "Ткани", href: "/fabrics" },
    { label: category.name_ru, href: `/fabrics/${params.categoryId}` },
    { label: collection.name_ru, href: `/fabrics/${params.categoryId}/${params.collectionId}`, isCurrent: true },
  ]

  return (
    <div className="container">
      <Breadcrumbs items={breadcrumbItems} />

      <FabricDetail
        category={category}
        collection={collection}
        similarCollections={similarCollections}
        categoryId={params.categoryId}
      />
    </div>
  )
}
