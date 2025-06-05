"use client"

import { useState } from "react"
import Image from "next/image"
import styles from "./page.module.css"

export default function DeliveryPageClient() {
  const [activeTab, setActiveTab] = useState("delivery")

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  return (
    <div className="container">
      <h1 className={styles.title}>Доставка и оплата</h1>

      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "delivery" ? styles.active : ""}`}
            onClick={() => handleTabChange("delivery")}
          >
            Доставка
          </button>
          <button
            className={`${styles.tab} ${activeTab === "payment" ? styles.active : ""}`}
            onClick={() => handleTabChange("payment")}
          >
            Оплата
          </button>
          <button
            className={`${styles.tab} ${activeTab === "faq" ? styles.active : ""}`}
            onClick={() => handleTabChange("faq")}
          >
            Вопросы и ответы
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {activeTab === "delivery" && (
          <div className={styles.section}>
            <div className={styles.sectionContent}>
              <div className={styles.text}>
                <p>
                  Мы осуществляем доставку по всей территории Республики Беларусь. Доставка осуществляется бесплатно при
                  заказе от 500 рублей.
                </p>

                <h3 className={styles.subTitle}>Сроки доставки:</h3>
                <ul className={styles.list}>
                  <li>Минск - 1-2 дня</li>
                  <li>Областные центры - 2-3 дня</li>
                  <li>Другие населенные пункты - 3-5 дней</li>
                </ul>

                <p>Точную дату доставки вы можете уточнить у менеджера при оформлении заказа.</p>
              </div>
              <div className={styles.imageWrapper}>
                <Image
                  src="/furniture-delivery.png"
                  alt="Доставка мебели"
                  width={400}
                  height={300}
                  className={styles.image}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "payment" && (
          <div className={styles.section}>
            <div className={styles.sectionContent}>
              <div className={styles.text}>
                <p>Мы предлагаем несколько способов оплаты для вашего удобства:</p>

                <ul className={styles.list}>
                  <li>Наличными при получении</li>
                  <li>Банковской картой при получении</li>
                  <li>Онлайн-оплата на сайте</li>
                  <li>Безналичный расчет (для юридических лиц)</li>
                </ul>

                <h3 className={styles.subTitle}>Рассрочка и кредит:</h3>
                <p>
                  Мы сотрудничаем с ведущими банками Беларуси и предлагаем возможность приобретения мебели в рассрочку
                  или кредит:
                </p>

                <ul className={styles.list}>
                  <li>Рассрочка от Альфа-Банка - до 4 месяцев без процентов</li>
                  <li>Рассрочка от БеларусБанка - до 6 месяцев без процентов</li>
                  <li>Кредит - до 36 месяцев по тарифам банка</li>
                </ul>
              </div>
              <div className={styles.imageWrapper}>
                <Image
                  src="/payment-methods.png"
                  alt="Способы оплаты"
                  width={400}
                  height={300}
                  className={styles.image}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "faq" && (
          <div className={styles.section}>
            <div className={styles.faqList}>
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Как отслеживать статус заказа?</h3>
                <p className={styles.faqAnswer}>
                  После оформления заказа вы получите уникальный номер, по которому можно отслеживать статус в личном
                  кабинете или уточнить у менеджера по телефону.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Что делать, если товар не подошел?</h3>
                <p className={styles.faqAnswer}>
                  Вы можете вернуть товар в течение 14 дней с момента получения, если он не был в использовании и
                  сохранил товарный вид. Для этого свяжитесь с нашим менеджером.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Как оформить доставку в другой город?</h3>
                <p className={styles.faqAnswer}>
                  При оформлении заказа укажите адрес доставки. Наш менеджер свяжется с вами для уточнения деталей и
                  согласования даты доставки.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Можно ли заказать сборку мебели?</h3>
                <p className={styles.faqAnswer}>
                  Да, мы предоставляем услугу сборки мебели. Стоимость зависит от сложности и объема работ. Уточните
                  детали у менеджера при оформлении заказа.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
