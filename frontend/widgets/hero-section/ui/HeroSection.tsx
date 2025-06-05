"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Button from "@/shared/ui/button/Button"
import styles from "./HeroSection.module.css"

export const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const heroSlides = [
    {
      title: "Создайте уютный дом с нашей мебелью",
      description:
        "Широкий выбор качественной мебели для вашего дома. Диваны, кровати и другая мебель с доставкой по всей Беларуси.",
      image: "/modern-living-room.png",
      buttonText: "Перейти в каталог",
      buttonLink: "/catalog",
    },
    {
      title: "Специальное предложение на диваны",
      description:
        "Скидка до 15% на все диваны при заказе до конца месяца. Используйте промокод ДИВАН15 при оформлении заказа.",
      image: "/sofa-promo.png",
      buttonText: "Смотреть диваны",
      buttonLink: "/catalog?category=sofa",
    },
    {
      title: "Новая коллекция кроватей",
      description: "Встречайте новую коллекцию кроватей с ортопедическими матрасами для здорового сна и отдыха.",
      image: "/bed-collection.png",
      buttonText: "Смотреть кровати",
      buttonLink: "/catalog?category=bed",
    },
  ]

  // Auto-slide functionality
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1))
    }, 6000)

    return () => clearInterval(interval)
  }, [isPaused, heroSlides.length])

  const handleSlideChange = (index: number) => {
    setCurrentSlide(index)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))
  }

  return (
    <section
      className={styles.heroSection}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={styles.sliderContainer}>
        <div className={styles.sliderTrack} style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {heroSlides.map((slide, index) => (
            <div key={index} className={styles.slide}>
              <div className={styles.slideBackground} style={{ backgroundImage: `url(${slide.image})` }}></div>
              <div className="container">
                <div className={styles.content}>
                  <h1 className={styles.title}>{slide.title}</h1>
                  <p className={styles.description}>{slide.description}</p>
                  <div className={styles.actions}>
                    <Link href={slide.buttonLink}>
                      <Button size="lg">{slide.buttonText}</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          className={`${styles.sliderButton} ${styles.prevButton}`}
          onClick={prevSlide}
          aria-label="Предыдущий слайд"
        >
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

        <button
          className={`${styles.sliderButton} ${styles.nextButton}`}
          onClick={nextSlide}
          aria-label="Следующий слайд"
        >
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

        <div className={styles.sliderDots}>
          {heroSlides.map((_, index) => (
            <button
              key={index}
              className={`${styles.sliderDot} ${currentSlide === index ? styles.active : ""}`}
              onClick={() => handleSlideChange(index)}
              aria-label={`Перейти к слайду ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default HeroSection
