import Image from "next/image"
import styles from "./Reviews.module.css"

export const Reviews = () => {
  const reviews = [
    {
      id: 1,
      name: "Анна Иванова",
      avatar: "/avatar-1.png",
      text: "Очень довольна покупкой дивана. Качество отличное, доставили быстро. Буду рекомендовать ваш магазин друзьям!",
      rating: 5,
      date: "15.04.2025",
    },
    {
      id: 2,
      name: "Сергей Петров",
      avatar: "/avatar-2.png",
      text: "Заказывал кровать с подъемным механизмом. Все соответствует описанию, сборка была включена в стоимость. Очень удобная кровать!",
      rating: 5,
      date: "02.04.2025",
    },
    {
      id: 3,
      name: "Екатерина Смирнова",
      avatar: "/avatar-3.png",
      text: "Спасибо за отличный сервис! Диван доставили в срок, качество на высоте. Единственное, хотелось бы больше вариантов обивки.",
      rating: 4,
      date: "28.03.2025",
    },
  ]

  return (
    <section className={styles.reviews}>
      <div className="container">
        <h2 className={styles.title}>Отзывы наших клиентов</h2>
        <div className={styles.reviewsGrid}>
          {reviews.map((review) => (
            <div key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.avatar}>
                  <Image src={review.avatar || "/placeholder.svg"} alt={review.name} width={50} height={50} />
                </div>
                <div className={styles.reviewInfo}>
                  <h3 className={styles.reviewName}>{review.name}</h3>
                  <div className={styles.rating}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span key={index} className={`${styles.star} ${index < review.rating ? styles.filled : ""}`}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.reviewDate}>{review.date}</div>
              </div>
              <p className={styles.reviewText}>{review.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Reviews
