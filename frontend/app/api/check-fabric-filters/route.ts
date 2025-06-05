import { NextResponse } from "next/server"
import { filterFabricCollections } from "@/shared/api/fabric-api"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const categoryName = searchParams.get("category")

  if (!categoryName) {
    return NextResponse.json({ error: "Category name is required" }, { status: 400 })
  }

  // Получаем параметры фильтрации из запроса
  const collectionsFilter = searchParams.get("collections") ? searchParams.get("collections")!.split(",") : undefined
  const typesFilter = searchParams.get("types") ? searchParams.get("types")!.split(",") : undefined
  const minAbrasionFilter = searchParams.get("minAbrasion") ? Number(searchParams.get("minAbrasion")) : undefined
  const maxAbrasionFilter = searchParams.get("maxAbrasion") ? Number(searchParams.get("maxAbrasion")) : undefined
  const availabilityFilter = searchParams.get("availability") ? searchParams.get("availability")!.split(",") : undefined

  try {
    // Получаем коллекции с учетом фильтров
    const collections = await filterFabricCollections(categoryName, {
      collections: collectionsFilter,
      types: typesFilter,
      minAbrasion: minAbrasionFilter,
      maxAbrasion: maxAbrasionFilter,
      availability: availabilityFilter,
    })

    return NextResponse.json(collections)
  } catch (error) {
    console.error("Error filtering fabric collections:", error)
    return NextResponse.json({ error: "Failed to filter collections" }, { status: 500 })
  }
}
