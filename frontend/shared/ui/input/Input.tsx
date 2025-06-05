import type React from "react"
import { type InputHTMLAttributes, forwardRef } from "react"
import styles from "./Input.module.css"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  className?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className={`${styles.inputWrapper} ${className}`}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={styles.inputContainer}>
          {leftIcon && <div className={styles.leftIcon}>{leftIcon}</div>}
          <input
            ref={ref}
            className={`${styles.input} ${error ? styles.error : ""} ${leftIcon ? styles.hasLeftIcon : ""} ${rightIcon ? styles.hasRightIcon : ""}`}
            {...props}
          />
          {rightIcon && <div className={styles.rightIcon}>{rightIcon}</div>}
        </div>
        {error && <p className={styles.errorMessage}>{error}</p>}
      </div>
    )
  },
)

Input.displayName = "Input"

export default Input
