import Link from "next/link"
import styles from "./Footer.module.css"

export const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.container}`}>
        <div className={styles.top}>
          <div className={styles.column}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoText}>Dilavia</span>
            </Link>
            <p className={styles.description}>
              Качественная мебель для вашего дома по доступным ценам. Диваны, кровати и другая мебель с доставкой по
              всей Беларуси.
            </p>
          </div>

          <div className={styles.column}>
            <h3 className={styles.title}>Каталог</h3>
            <ul className={styles.list}>
              <li>
                <Link href="/fabrics" className={styles.link}>
                  Ткани
                </Link>
              </li>
              <li>
                <Link href="/catalog/sofa" className={styles.link}>
                  Диваны
                </Link>
              </li>
              <li>
                <Link href="/catalog/bed" className={styles.link}>
                  Кровати
                </Link>
              </li>
            </ul>
          </div>

          <div className={styles.column}>
            <h3 className={styles.title}>Информация</h3>
            <ul className={styles.list}>
              <li>
                <Link href="/about" className={styles.link}>
                  О нас
                </Link>
              </li>
              <li>
                <Link href="/contacts" className={styles.link}>
                  Контакты
                </Link>
              </li>
              <li>
                <Link href="/delivery" className={styles.link}>
                  Доставка и оплата
                </Link>
              </li>
            </ul>
          </div>

          <div className={styles.column}>
            <h3 className={styles.title}>Контакты</h3>
            <ul className={styles.list}>
              <li className={styles.contactItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <a href="tel:+375291234567" className={styles.link}>
                  +375 (29) 123-45-67
                </a>
              </li>
              <li className={styles.contactItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 6l-10 7L2 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <a href="mailto:info@furniture.by" className={styles.link}>
                  info@furniture.by
                </a>
              </li>
              <li className={styles.contactItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="10"
                    r="3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>г. Минск, ул. Примерная, 123</span>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>© {new Date().getFullYear()} Мебельный магазин. Все права защищены.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
