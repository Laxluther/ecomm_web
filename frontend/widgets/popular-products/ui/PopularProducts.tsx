"use client"

import { useEffect, useState, useRef } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination, Autoplay } from "swiper/modules"
import ProductCard from "@/entities/product/ui/ProductCard"
import styles from "./PopularProducts.module.css"

// Import Swiper styles
import "swiper/css"
import "swiper/css/pagination"

export const PopularProducts = ({ products }: { products: any[] }) => {
  const [slidesPerView, setSlidesPerView] = useState(4)
  const prevRef = useRef<HTMLDivElement>(null)
  const nextRef = useRef<HTMLDivElement>(null)
  const paginationRef = useRef<HTMLDivElement>(null)

  // Update slides per view based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1200) {
        setSlidesPerView(4)
      } else if (window.innerWidth >= 768) {
        setSlidesPerView(3)
      } else if (window.innerWidth >= 576) {
        setSlidesPerView(2)
      } else {
        setSlidesPerView(1)
      }
    }

    handleResize() // Set initial value
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  if (products.length === 0) {
    return (
      <section className={styles.popularProducts}>
        <div className="container">
          <h2 className={styles.title}>Популярные товары</h2>
          <div className={styles.noProducts}>
            <p>В данный момент нет популярных товаров.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.popularProducts}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.title}>Популярные товары</h2>
          <p className={styles.subtitle}>Товары с рейтингом популярности выше 4.5</p>
        </div>

        <div className={styles.swiperContainer}>
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={20}
            slidesPerView={slidesPerView}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            pagination={{
              clickable: true,
              el: paginationRef.current,
            }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            loop={products.length > slidesPerView}
            className={styles.swiper}
            onBeforeInit={(swiper) => {
              // @ts-ignore
              swiper.params.navigation.prevEl = prevRef.current
              // @ts-ignore
              swiper.params.navigation.nextEl = nextRef.current
              // @ts-ignore
              swiper.params.pagination.el = paginationRef.current
            }}
          >
            {products.map((product) => (
              <SwiperSlide key={product.id} className={styles.swiperSlide}>
                <div className={styles.productWrapper}>
                  <ProductCard product={product} />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className={styles.customNavigation}>
            <div ref={prevRef} className={styles.navPrev}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div ref={nextRef} className={styles.navNext}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9 6L15 12L9 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div ref={paginationRef} className={styles.customPagination}></div>
        </div>
      </div>
    </section>
  )
}

export default PopularProducts
