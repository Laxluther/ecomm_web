import type { SofaData, BedData, ProductData } from "./types"

const API_BASE_URL = "https://eb5cd2a292a9c526.mokky.dev"

export async function getSofas(): Promise<SofaData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/sofa`)
    if (!response.ok) {
      throw new Error("Failed to fetch sofas")
    }
    return response.json()
  } catch (error) {
    console.error("Error fetching sofas:", error)
    return []
  }
}

export async function getSofaBySlug(slug: string): Promise<SofaData | null> {
  try {
    const sofas = await getSofas()
    return sofas.find((sofa) => sofa.slug === slug) || null
  } catch (error) {
    console.error("Error fetching sofa by slug:", error)
    return null
  }
}

export async function getBeds(): Promise<BedData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/bed`)
    if (!response.ok) {
      throw new Error("Failed to fetch beds")
    }
    return response.json()
  } catch (error) {
    console.error("Error fetching beds:", error)
    return []
  }
}

export async function getBedBySlug(slug: string): Promise<BedData | null> {
  try {
    const beds = await getBeds()
    return beds.find((bed) => bed.slug === slug) || null
  } catch (error) {
    console.error("Error fetching bed by slug:", error)
    return null
  }
}

export async function getPopularProducts(limit = 8): Promise<(SofaData | BedData)[]> {
  try {
    const [sofas, beds] = await Promise.all([getSofas(), getBeds()])
    const allProducts = [...sofas, ...beds]

    // Filter products with popularity > 4.5 and sort by popularity
    const popularProducts = allProducts
      .filter((product) => product.popularity > 4.5)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit)

    return popularProducts
  } catch (error) {
    console.error("Error fetching popular products:", error)
    return []
  }
}

export async function getProductsByCategory(category: string): Promise<(SofaData | BedData)[]> {
  try {
    if (category === "sofa") {
      return await getSofas()
    } else if (category === "bed") {
      return await getBeds()
    } else {
      const [sofas, beds] = await Promise.all([getSofas(), getBeds()])
      return [...sofas, ...beds]
    }
  } catch (error) {
    console.error(`Error fetching products by category ${category}:`, error)
    return []
  }
}

export async function getProductsByPriceRange(
  minPrice: number,
  maxPrice: number,
  category = "all",
): Promise<ProductData[]> {
  try {
    const products = await getProductsByCategory(category)
    return products.filter((product) => product.price.current >= minPrice && product.price.current <= maxPrice)
  } catch (error) {
    console.error("Error filtering products by price range:", error)
    return []
  }
}

export async function getProductsByFilters(filters: {
  category?: string
  minPrice?: number
  maxPrice?: number
}): Promise<ProductData[]> {
  try {
    const { category = "all", minPrice, maxPrice } = filters
    let products = await getProductsByCategory(category)

    // Filter by price range
    if (minPrice !== undefined && maxPrice !== undefined) {
      products = products.filter((product) => product.price.current >= minPrice && product.price.current <= maxPrice)
    }

    return products
  } catch (error) {
    console.error("Error filtering products:", error)
    return []
  }
}

export async function getPriceRange(): Promise<{ min: number; max: number }> {
  try {
    const [sofas, beds] = await Promise.all([getSofas(), getBeds()])
    const allProducts = [...sofas, ...beds]

    const prices = allProducts.map((product) => product.price.current)
    const min = Math.min(...prices)
    const max = Math.max(...prices)

    return { min, max }
  } catch (error) {
    console.error("Error fetching price range:", error)
    return { min: 0, max: 10000 } // Default fallback
  }
}

// Add a new function to sort products
export async function getSortedProducts(products: ProductData[], sortBy: string): Promise<ProductData[]> {
  const sortedProducts = [...products]

  switch (sortBy) {
    case "price-asc":
      return sortedProducts.sort((a, b) => a.price.current - b.price.current)
    case "price-desc":
      return sortedProducts.sort((a, b) => b.price.current - a.price.current)
    case "name-asc":
      return sortedProducts.sort((a, b) => a.name.localeCompare(b.name))
    case "name-desc":
      return sortedProducts.sort((a, b) => b.name.localeCompare(a.name))
    case "popularity":
      return sortedProducts.sort((a, b) => b.popularity - a.popularity)
    default:
      return sortedProducts
  }
}
