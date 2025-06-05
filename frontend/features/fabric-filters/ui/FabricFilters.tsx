import FabricFiltersClient from "./FabricFiltersClient"

interface FabricFiltersProps {
  collections: string[]
  types: string[]
  abrasionResistances: string[]
  availabilities: string[]
  className?: string
}

export default function FabricFilters(props: FabricFiltersProps) {
  return <FabricFiltersClient {...props} />
}
