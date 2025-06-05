import Link from "next/link"
import Image from "next/image"
import styles from "./Categories.module.css"

export const Categories = () => {
  const categories = [
    {
      id: "sofa",
      name: "Диваны",
      image: "/category-sofa.png",
      url: "/catalog/sofa",
    },
    {
      id: "bed",
      name: "Кровати",
      image: "/category-bed.png",
      url: "/catalog/bed",
    },
  ]

  return (
    <section className={styles.categories}>
      <div className="container">
        <h2 className={styles.title}>Категории</h2>
        <div className={styles.categoryGrid}>
          {categories.map((category) => (
            <Link href={category.url} key={category.id} className={styles.categoryCard}>
              <div className={styles.imageWrapper}>
                <Image
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  width={400}
                  height={300}
                  className={styles.image}
                />
              </div>
              <h3 className={styles.categoryName}>{category.name}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Categories
