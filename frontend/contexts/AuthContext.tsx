"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useToast } from "./ToastContext"

interface User {
  user_id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  date_of_birth?: string
  gender?: string
  email_verified: boolean
  profile_image?: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>
  register: (userData: {
    email: string
    password: string
    first_name: string
    last_name: string
    phone: string
  }) => Promise<boolean>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setLoading(false)
        return
      }

      api.setToken(token)
      const response = await api.getCurrentUser()

      if (response.data?.user) {
        setUser(response.data.user)
      } else {
        // Token is invalid, remove it
        localStorage.removeItem("auth_token")
        api.setToken(null)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      localStorage.removeItem("auth_token")
      api.setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string, rememberMe = false): Promise<boolean> => {
    try {
      const response = await api.login({
        email,
        password,
        remember_me: rememberMe,
        use_cookies: true,
      })

      if (response.data?.token && response.data?.user) {
        api.setToken(response.data.token)
        setUser(response.data.user)
        showToast("Login successful!", "success")
        return true
      } else if (response.error) {
        showToast(response.error, "error")
        return false
      }
    } catch (error) {
      showToast("Login failed. Please try again.", "error")
    }
    return false
  }

  const register = async (userData: {
    email: string
    password: string
    first_name: string
    last_name: string
    phone: string
  }): Promise<boolean> => {
    try {
      const response = await api.register(userData)

      if (response.data?.message) {
        showToast(response.data.message, "success")
        return true
      } else if (response.error) {
        showToast(response.error, "error")
        return false
      }
    } catch (error) {
      showToast("Registration failed. Please try again.", "error")
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem("auth_token")
    api.setToken(null)
    setUser(null)
    showToast("Logged out successfully", "success")
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData })
    }
  }

  const refreshUser = async () => {
    try {
      const response = await api.getCurrentUser()
      if (response.data?.user) {
        setUser(response.data.user)
      }
    } catch (error) {
      console.error("Failed to refresh user:", error)
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
