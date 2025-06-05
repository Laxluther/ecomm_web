import { NextResponse } from "next/server"
import { getProductsByFilters } from "@/shared/api/api"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  // Получаем параметры фильтрации из запроса
  const category = searchParams.get("category") || "all"
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined

  try {
    // Получаем товары с учетом фильтров
    const products = await getProductsByFilters({
      category,
      minPrice,
      maxPrice,
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error("Error filtering products:", error)
    return NextResponse.json({ error: "Failed to filter products" }, { status: 500 })
  }
}
