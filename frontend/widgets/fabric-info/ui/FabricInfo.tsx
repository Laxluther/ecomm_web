import Image from "next/image"
import styles from "./FabricInfo.module.css"

export const FabricInfo = () => {
  return (
    <section className={styles.infoSection}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h2 className={styles.title}>Как выбрать ткань для мебели?</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <div className={styles.iconWrapper}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3.27 6.96L12 12.01l8.73-5.05"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 22.08V12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Износостойкость</h3>
              <p className={styles.cardText}>
                Обратите внимание на показатель износостойкости (количество циклов). Для мебели, которая используется
                ежедневно, рекомендуется выбирать ткани с показателем от 30 000 циклов.
              </p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.iconWrapper}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Состав ткани</h3>
              <p className={styles.cardText}>
                Натуральные ткани приятны на ощупь, но менее практичны. Синтетические ткани более долговечны и устойчивы
                к загрязнениям. Оптимальный вариант — смесовые ткани, сочетающие лучшие качества.
              </p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.iconWrapper}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Практичность</h3>
              <p className={styles.cardText}>
                Для семей с детьми и домашними животными рекомендуются ткани с водоотталкивающей пропиткой, легко
                чистящиеся и не накапливающие шерсть и пыль.
              </p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.iconWrapper}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Эстетика</h3>
              <p className={styles.cardText}>
                Выбирайте ткань, которая гармонирует с общим стилем интерьера. Учитывайте не только цвет, но и фактуру,
                рисунок и текстуру ткани.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.imageContainer}>
          <Image
            src="/fabric-selection-guide.png"
            alt="Руководство по выбору тканей"
            width={600}
            height={400}
            className={styles.image}
          />
        </div>
      </div>
    </section>
  )
}

export default FabricInfo
