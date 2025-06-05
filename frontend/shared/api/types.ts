// Существующие типы
export interface Price {
  current: number
  old?: number
}

export interface ProductData {
  id: string
  name: string
  slug: string
  description: string
  images: string[]
  price: Price
  availability: string
  manufacturing?: string
  popularity: number
  features?: string[]
  materials?: Material[]
  country: string
  warranty: string
  installment_plans?: InstallmentPlan[]
}

export interface SofaData extends ProductData {
  sizes?: {
    sofa?: Size[]
  }
}

export interface BedData extends ProductData {
  bed?: SizeWithMechanism[]
}

export interface Size {
  width: number
  length: number
  price: number
}

export interface SizeWithMechanism extends Size {
  lifting_mechanism: Mechanism[]
}

export interface Mechanism {
  type: string
  price: number
}

export interface Material {
  localizedTitles: {
    ru: string
  }
  type: string
}

export interface InstallmentPlan {
  bank: string
  installment: {
    duration_months: number
    interest: string
    additional_fees: string
  }
  credit: {
    duration_months: number
    interest: string
  }
}

// Новые типы для тканей
export interface FabricCategory {
  name: string
  name_ru: string
  description_ru?: string
  collections: FabricCollection[]
}

export interface FabricCollection {
  name: string
  name_ru: string
  type: string
  availability: string
  description_ru?: string
  technicalSpecifications: {
    fabricType: string
    abrasionResistance: string
    density: string
    composition: string
    composition_ru: string
    width: string
    origin: string
    origin_ru: string
    collectionName?: string
    directionality?: string
    directionality_ru?: string
    applicationAreas_ru?: string[]
  }
  careInstructions_ru: string[]
  variants: FabricVariant[]
}

export interface FabricVariant {
  id: number
  color: {
    en: string
    ru: string
  }
  image: string
}

export interface FabricCartItem {
  id: string
  categoryName: string
  categoryNameRu: string
  collectionName: string
  collectionNameRu: string
  variant: FabricVariant
  quantity: number
}

export interface FabricFavoriteItem {
  id: string
  categoryName: string
  categoryNameRu: string
  collectionName: string
  collectionNameRu: string
  variant: FabricVariant
}
