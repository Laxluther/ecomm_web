import Link from "next/link"
import Image from "next/image"
import Button from "@/shared/ui/button/Button"
import styles from "./PromoSection.module.css"

export const PromoSection = () => {
  return (
    <section className={styles.promoSection}>
      <div className="container">
        <div className={styles.promoCard}>
          <div className={styles.content}>
            <h2 className={styles.title}>Специальное предложение</h2>
            <p className={styles.description}>
              Скидка 15% на все кровати и диваны при заказе до конца месяца. Используйте промокод МЕБЕЛЬ15 при
              оформлении заказа.
            </p>
            <div className={styles.actions}>
              <Link href="/catalog">
                <Button>Перейти в каталог</Button>
              </Link>
            </div>
          </div>
          <div className={styles.imageWrapper}>
            <Image
              src="/promo-furniture.png"
              alt="Специальное предложение"
              width={500}
              height={300}
              className={styles.image}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default PromoSection
