"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import type { SofaData, BedData } from "@/shared/api/types"
import Button from "@/shared/ui/button/Button"
import { useCart } from "@/entities/cart/model/cartContext"
import { useFavorites } from "@/entities/favorites/model/favoritesContext"
import { useRecentlyViewed } from "@/entities/recently-viewed/model/recentlyViewedContext"
import ProductCard from "@/entities/product/ui/ProductCard"
import { getProductsByCategory } from "@/shared/api/api"
import styles from "./ProductDetail.module.css"

interface ProductDetailProps {
  product: SofaData | BedData
}

export const ProductDetail = ({ product }: ProductDetailProps) => {
  const [activeTab, setActiveTab] = useState("description")
  const [selectedSize, setSelectedSize] = useState<number | null>(0) // Default to first size
  const [withMechanism, setWithMechanism] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [similarProducts, setSimilarProducts] = useState<(SofaData | BedData)[]>([])
  const productLoadedRef = useRef(false)

  const { state: cartState, dispatch: cartDispatch } = useCart()
  const { state: favoritesState, dispatch: favoritesDispatch } = useFavorites()
  const { addViewedProduct } = useRecentlyViewed()

  const isBed = "bed" in product

  // Generate a unique ID for this product configuration
  const cartItemId = `${product.id}-${selectedSize}-${withMechanism}`

  // Check if this exact configuration is in cart
  const cartItem = cartState.items.find((item) => item.id === cartItemId)
  const isInCart = Boolean(cartItem)

  // Check if product is in favorites
  const isInFavorites = favoritesState.items.some((item) => item.id === product.id)

  // Add product to recently viewed - only once when component mounts
  useEffect(() => {
    if (!productLoadedRef.current) {
      addViewedProduct(product)
      productLoadedRef.current = true
    }
  }, [product, addViewedProduct])

  // Load similar products
  useEffect(() => {
    const loadSimilarProducts = async () => {
      try {
        const category = isBed ? "bed" : "sofa"
        const products = await getProductsByCategory(category)
        // Filter out current product and limit to 4 products
        const filtered = products
          .filter((p) => p.id !== product.id)
          .sort(() => 0.5 - Math.random()) // Simple random sort
          .slice(0, 4)
        setSimilarProducts(filtered)
      } catch (error) {
        console.error("Error loading similar products:", error)
      }
    }

    loadSimilarProducts()
  }, [product.id, isBed])

  // Slider navigation
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  // Safely get sizes based on product type
  const getSizes = () => {
    if (isBed && product.bed && Array.isArray(product.bed)) {
      return product.bed.map((size) => ({
        width: size.width,
        length: size.length,
        price: size.price,
      }))
    } else if (
      !isBed &&
      "sizes" in product &&
      product.sizes &&
      product.sizes.sofa &&
      Array.isArray(product.sizes.sofa)
    ) {
      return product.sizes.sofa.map((size) => ({
        width: size.width,
        length: size.length,
        price: size.price,
      }))
    }
    return []
  }

  const sizes = getSizes()

  // Get price with selected options
  const getPrice = () => {
    if (selectedSize === null || !sizes || sizes.length === 0) {
      return product.price.current
    }

    let price = sizes[selectedSize].price

    // Add mechanism price for beds
    if (
      isBed &&
      withMechanism &&
      product.bed &&
      product.bed[selectedSize] &&
      product.bed[selectedSize].lifting_mechanism &&
      product.bed[selectedSize].lifting_mechanism.length > 1
    ) {
      price += product.bed[selectedSize].lifting_mechanism[1].price
    }

    return price
  }

  const handleAddToCart = () => {
    if (selectedSize === null) return

    const price = getPrice()

    cartDispatch({
      type: "ADD_TO_CART",
      payload: {
        id: cartItemId,
        product,
        quantity: 1, // Always add with quantity 1
        selectedSize,
        withMechanism,
        totalPrice: price,
      },
    })
  }

  const handleToggleFavorite = () => {
    if (isInFavorites) {
      favoritesDispatch({
        type: "REMOVE_FROM_FAVORITES",
        payload: product.id,
      })
    } else {
      favoritesDispatch({
        type: "ADD_TO_FAVORITES",
        payload: {
          id: product.id,
          product,
        },
      })
    }
  }

  // Safely check if lifting mechanism is available
  const hasLiftingMechanism = () => {
    return (
      isBed &&
      selectedSize !== null &&
      product.bed &&
      product.bed[selectedSize] &&
      product.bed[selectedSize].lifting_mechanism &&
      product.bed[selectedSize].lifting_mechanism.length > 1
    )
  }

  // Toggle mechanism with a single click
  const handleToggleMechanism = () => {
    setWithMechanism(!withMechanism)
  }

  return (
    <div className="container">
      <div className={styles.breadcrumbs}>
        <Link href="/" className={styles.breadcrumbLink}>
          Главная
        </Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <Link href="/catalog" className={styles.breadcrumbLink}>
          Каталог
        </Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <Link href={`/catalog?category=${isBed ? "bed" : "sofa"}`} className={styles.breadcrumbLink}>
          {isBed ? "Кровати" : "Диваны"}
        </Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent}>{product.name}</span>
      </div>

      <div className={styles.productDetail}>
        <div className={styles.gallery}>
          <div className={styles.slider}>
            <button className={styles.sliderButton} onClick={prevSlide} aria-label="Предыдущее изображение">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div className={styles.sliderTrack} style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
              {product.images.map((image, index) => (
                <div key={index} className={styles.slide}>
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${product.name} - изображение ${index + 1}`}
                    width={600}
                    height={600}
                    className={styles.slideImage}
                  />
                </div>
              ))}
            </div>

            <button className={styles.sliderButton} onClick={nextSlide} aria-label="Следующее изображение">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9 6L15 12L9 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className={styles.thumbnails}>
            {product.images.map((image, index) => (
              <div
                key={index}
                className={`${styles.thumbnail} ${currentSlide === index ? styles.active : ""}`}
                onClick={() => goToSlide(index)}
              >
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`${product.name} - миниатюра ${index + 1}`}
                  width={100}
                  height={100}
                  className={styles.thumbnailImage}
                />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.info}>
          <h1 className={styles.title}>{product.name}</h1>

          <div className={styles.availability}>
            <span className={styles.availabilityText}>{product.availability}</span>
            {product.manufacturing && <span className={styles.manufacturing}>{product.manufacturing}</span>}
          </div>

          <div className={styles.price}>
            <span className={styles.currentPrice}>{getPrice()} руб.</span>
            {product.price.old && <span className={styles.oldPrice}>{product.price.old} руб.</span>}
          </div>

          {sizes.length > 0 && (
            <div className={styles.optionGroup}>
              <h3 className={styles.optionTitle}>Размер:</h3>
              <div className={styles.sizeOptions}>
                {sizes.map((size, index) => (
                  <button
                    key={index}
                    className={`${styles.sizeOption} ${selectedSize === index ? styles.active : ""}`}
                    onClick={() => setSelectedSize(index)}
                  >
                    {size.width}x{size.length} см
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasLiftingMechanism() && (
            <div className={styles.optionGroup}>
              <h3 className={styles.optionTitle}>Подъемный механизм:</h3>
              <div className={styles.mechanismOptions}>
                <div
                  className={`${styles.mechanismOption} ${withMechanism ? styles.active : ""}`}
                  onClick={handleToggleMechanism}
                >
                  <div className={styles.checkboxWrapper}>
                    <div className={`${styles.customCheckbox} ${withMechanism ? styles.checked : ""}`}>
                      {withMechanism && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M20 6L9 17L4 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span>
                    Добавить подъемный механизм (+
                    {product.bed[selectedSize as number].lifting_mechanism[1].price} руб.)
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <Button
              variant={isInCart ? "secondary" : "primary"}
              size="lg"
              className={styles.addToCartButton}
              onClick={handleAddToCart}
            >
              {isInCart ? "В корзине" : "В корзину"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className={`${styles.favoriteButton} ${isInFavorites ? styles.favoriteActive : ""}`}
              onClick={handleToggleFavorite}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill={isInFavorites ? "currentColor" : "none"}
                />
              </svg>
              {isInFavorites ? "В избранном" : "В избранное"}
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.details}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "description" ? styles.active : ""}`}
            onClick={() => setActiveTab("description")}
          >
            Описание
          </button>
          <button
            className={`${styles.tab} ${activeTab === "materials" ? styles.active : ""}`}
            onClick={() => setActiveTab("materials")}
          >
            Материалы
          </button>
          <button
            className={`${styles.tab} ${activeTab === "payment" ? styles.active : ""}`}
            onClick={() => setActiveTab("payment")}
          >
            Оплата и рассрочка
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === "description" && (
            <div className={styles.description}>
              <p>{product.description}</p>
              <h3>Характеристики:</h3>
              <ul className={styles.featuresList}>
                {product.features &&
                  product.features.map((feature, index) => (
                    <li key={index} className={styles.featureItem}>
                      {feature}
                    </li>
                  ))}
                <li className={styles.featureItem}>Страна: {product.country}</li>
                <li className={styles.featureItem}>Гарантия: {product.warranty}</li>
              </ul>
            </div>
          )}

          {activeTab === "materials" && (
            <div className={styles.materials}>
              <ul className={styles.materialsList}>
                {product.materials &&
                  product.materials.map((material, index) => (
                    <li key={index} className={styles.materialItem}>
                      <strong>{material.localizedTitles.ru}:</strong> {material.type}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {activeTab === "payment" && (
            <div className={styles.payment}>
              <h3>Варианты оплаты:</h3>
              <ul className={styles.paymentList}>
                <li className={styles.paymentItem}>
                  <strong>Наличными при получении</strong> - оплата производится курьеру при доставке
                </li>
                <li className={styles.paymentItem}>
                  <strong>Банковской картой</strong> - оплата картой при получении или онлайн на сайте
                </li>
                <li className={styles.paymentItem}>
                  <strong>Безналичный расчет</strong> - для юридических лиц
                </li>
              </ul>

              {product.installment_plans && product.installment_plans.length > 0 && (
                <>
                  <h3>Рассрочка и кредит:</h3>
                  <div className={styles.installmentPlans}>
                    {product.installment_plans.map((plan, index) => (
                      <div key={index} className={styles.installmentPlan}>
                        <h4>{plan.bank}</h4>
                        <div className={styles.planDetails}>
                          <div className={styles.planOption}>
                            <strong>Рассрочка:</strong> {plan.installment.duration_months} мес., процент:{" "}
                            {plan.installment.interest}, доп. комиссии: {plan.installment.additional_fees}
                          </div>
                          <div className={styles.planOption}>
                            <strong>Кредит:</strong> до {plan.credit.duration_months} мес., процент:{" "}
                            {plan.credit.interest}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {similarProducts.length > 0 && (
        <div className={styles.recommendations}>
          <h2 className={styles.recommendationsTitle}>Похожие товары</h2>
          <div className={styles.recommendationsGrid}>
            {similarProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDetail
