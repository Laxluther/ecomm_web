"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import FabricSort from "./FabricSort"

interface FabricSortClientProps {
  className?: string
}

export const FabricSortClient = ({ className = "" }: FabricSortClientProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleSort = (sortOption: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (sortOption === "default") {
      params.delete("sort")
    } else {
      params.set("sort", sortOption)
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  return <FabricSort onSort={handleSort} className={className} />
}

export default FabricSortClient
