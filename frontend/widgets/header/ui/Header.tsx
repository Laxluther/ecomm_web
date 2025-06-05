"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useCart } from "@/entities/cart/model/cartContext"
import { useFavorites } from "@/entities/favorites/model/favoritesContext"
import { useFabricCart } from "@/entities/fabric-cart/model/fabricCartContext"
import { useFabricFavorites } from "@/entities/fabric-favorites/model/fabricFavoritesContext"
import styles from "./Header.module.css"

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { state: cartState } = useCart()
  const { state: favoritesState } = useFavorites()
  const { state: fabricCartState } = useFabricCart()
  const { state: fabricFavoritesState } = useFabricFavorites()
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Вычисляем общее количество товаров в корзине (мебель + ткани)
  const totalCartItems = cartState.totalItems + fabricCartState.totalItems

  // Вычисляем общее количество товаров в избранном (мебель + ткани)
  const totalFavoriteItems = favoritesState.totalItems + fabricFavoritesState.totalItems

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isMenuOpen])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isMenuOpen])

  return (
    <header className={styles.header}>
      <div className={`container ${styles.container}`}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>Dilavia</span>
        </Link>

        <button
          ref={buttonRef}
          className={`${styles.menuButton} ${isMenuOpen ? styles.active : ""}`}
          onClick={toggleMenu}
          aria-expanded={isMenuOpen}
          aria-label="Меню навигации"
        >
          <span className={styles.menuIcon}></span>
        </button>

        <div
          ref={menuRef}
          className={`${styles.mobileMenuOverlay} ${isMenuOpen ? styles.active : ""}`}
          onClick={(e) => {
            // Close menu only if clicking the overlay, not the menu content
            if (e.target === menuRef.current) {
              setIsMenuOpen(false)
            }
          }}
        >
          <nav className={`${styles.nav} ${isMenuOpen ? styles.active : ""}`}>
            <div className={styles.mobileMenuHeader}>
              <Link href="/" className={styles.mobileLogo} onClick={() => setIsMenuOpen(false)}>
                <span className={styles.logoText}>Dilavia</span>
              </Link>
              <button className={styles.closeMenuButton} onClick={() => setIsMenuOpen(false)} aria-label="Закрыть меню">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <ul className={styles.navList}>
              <li className={styles.navItem}>
                <Link href="/catalog" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>
                  Каталог
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/fabrics" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>
                  Ткани
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/catalog?category=sofa" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>
                  Диваны
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/catalog?category=bed" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>
                  Кровати
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/about" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>
                  О нас
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/contacts" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>
                  Контакты
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/delivery" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>
                  Доставка и оплата
                </Link>
              </li>
            </ul>

            <div className={styles.mobileActions}>
              <Link href="/favorites" className={styles.mobileActionButton} onClick={() => setIsMenuOpen(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
                <span>Избранное</span>
                {totalFavoriteItems > 0 && <span className={styles.mobileBadge}>{totalFavoriteItems}</span>}
              </Link>

              <Link href="/cart" className={styles.mobileActionButton} onClick={() => setIsMenuOpen(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Корзина</span>
                {totalCartItems > 0 && <span className={styles.mobileBadge}>{totalCartItems}</span>}
              </Link>
            </div>

            <div className={styles.mobileContact}>
              <a href="tel:+375291234567" className={styles.mobilePhone}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                +375 (29) 123-45-67
              </a>
            </div>
          </nav>
        </div>

        <nav className={styles.desktopNav}>
          <ul className={styles.navList}>
            <li className={styles.navItem}>
              <Link href="/catalog" className={styles.navLink}>
                Каталог
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/fabrics" className={styles.navLink}>
                Ткани
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/about" className={styles.navLink}>
                О нас
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/contacts" className={styles.navLink}>
                Контакты
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/delivery" className={styles.navLink}>
                Доставка и оплата
              </Link>
            </li>
          </ul>
        </nav>

        <div className={styles.actions}>
          <Link href="/favorites" className={styles.actionButton} aria-label="Избранное">
            <div className={styles.iconWrapper}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
              {totalFavoriteItems > 0 && <span className={styles.badge}>{totalFavoriteItems}</span>}
            </div>
          </Link>
          <Link href="/cart" className={styles.actionButton} aria-label="Корзина">
            <div className={styles.iconWrapper}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {totalCartItems > 0 && <span className={styles.badge}>{totalCartItems}</span>}
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Header
