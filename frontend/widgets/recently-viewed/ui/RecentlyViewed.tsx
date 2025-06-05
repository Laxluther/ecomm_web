"use client"

import { useRecentlyViewed } from "@/entities/recently-viewed/model/recentlyViewedContext"
import ProductCard from "@/entities/product/ui/ProductCard"
import styles from "./RecentlyViewed.module.css"

export const RecentlyViewed = () => {
  const { state } = useRecentlyViewed()

  // Only show if there are items
  if (state.items.length === 0) {
    return null
  }

  // Limit to 4 most recent items
  const recentItems = state.items.slice(0, 4)

  return (
    <section className={styles.recentlyViewed}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.title}>Недавно просмотренные</h2>
        </div>

        <div className={styles.productsGrid}>
          {recentItems.map((item) => (
            <div key={item.id} className={styles.productWrapper}>
              <ProductCard product={item.product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default RecentlyViewed
