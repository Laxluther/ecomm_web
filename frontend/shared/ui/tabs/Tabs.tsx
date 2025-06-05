"use client"

import type React from "react"

import { useState } from "react"
import styles from "./Tabs.module.css"

export interface TabItem {
  id: string
  label: string
  content: React.ReactNode
}

interface TabsProps {
  tabs: TabItem[]
  defaultTab?: string
  className?: string
}

export const Tabs = ({ tabs, defaultTab, className = "" }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || "")

  return (
    <div className={`${styles.tabsContainer} ${className}`}>
      <div className={styles.tabsHeader}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ""}`}
            onClick={() => setActiveTab(tab.id)}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.tabContent}>{tabs.find((tab) => tab.id === activeTab)?.content}</div>
    </div>
  )
}

export default Tabs
