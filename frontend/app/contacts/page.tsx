import type { Metadata } from "next"
import styles from "./page.module.css"

export const metadata: Metadata = {
  title: "Контакты",
  description: "Контактная информация мебельного магазина",
}

export default function ContactsPage() {
  return (
    <div className="container">
      <h1 className={styles.title}>Контакты</h1>

      <div className={styles.content}>
        <div className={styles.contactInfo}>
          <div className={styles.contactBlock}>
            <h2 className={styles.contactTitle}>Адрес</h2>
            <p className={styles.contactText}>г. Минск, ул. Примерная, 123</p>
          </div>

          <div className={styles.contactBlock}>
            <h2 className={styles.contactTitle}>Телефон</h2>
            <p className={styles.contactText}>
              <a href="tel:+375291234567" className={styles.contactLink}>
                +375 (29) 123-45-67
              </a>
            </p>
          </div>

          <div className={styles.contactBlock}>
            <h2 className={styles.contactTitle}>Email</h2>
            <p className={styles.contactText}>
              <a href="mailto:info@furniture.by" className={styles.contactLink}>
                info@furniture.by
              </a>
            </p>
          </div>

          <div className={styles.contactBlock}>
            <h2 className={styles.contactTitle}>Режим работы</h2>
            <p className={styles.contactText}>Пн-Пт: 9:00 - 20:00</p>
            <p className={styles.contactText}>Сб-Вс: 10:00 - 18:00</p>
          </div>
        </div>

        <div className={styles.mapWrapper}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d75241.51082857054!2d27.5095355!3d53.8847125!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46dbcfd35b1e6ad3%3A0xb61b853ddb570d9!2z0JzQuNC90YHQuiwg0JHQtdC70LDRgNGD0YHRjA!5e0!3m2!1sru!2sru!4v1620000000000!5m2!1sru!2sru"
            width="100%"
            height="450"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Карта"
            className={styles.map}
          ></iframe>
        </div>
      </div>
    </div>
  )
}
