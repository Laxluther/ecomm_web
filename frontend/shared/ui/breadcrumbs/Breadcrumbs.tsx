import Link from "next/link"
import styles from "./Breadcrumbs.module.css"

export interface BreadcrumbItem {
  label: string
  href: string
  isCurrent?: boolean
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export const Breadcrumbs = ({ items, className = "" }: BreadcrumbsProps) => {
  return (
    <nav className={`${styles.breadcrumbs} ${className}`} aria-label="Breadcrumbs">
      <ol className={styles.list}>
        {items.map((item, index) => (
          <li key={index} className={styles.item}>
            {index > 0 && <span className={styles.separator}>/</span>}
            {item.isCurrent ? (
              <span className={styles.current} aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className={styles.link}>
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default Breadcrumbs
