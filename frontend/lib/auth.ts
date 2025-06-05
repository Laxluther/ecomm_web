"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface User {
  user_id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  referral_code?: string
}

interface Admin {
  admin_id: string
  username: string
  email: string
  role: string
  full_name: string
}

interface AuthState {
  // User auth
  user: User | null
  token: string | null
  isAuthenticated: boolean

  // Admin auth
  admin: Admin | null
  adminToken: string | null
  isAdminAuthenticated: boolean

  // Actions
  login: (token: string, user: User) => void
  logout: () => void
  adminLogin: (token: string, admin: Admin) => void
  adminLogout: () => void
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      admin: null,
      adminToken: null,
      isAdminAuthenticated: false,

      // User actions
      login: (token: string, user: User) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("token", token)
          localStorage.setItem("user", JSON.stringify(user))
        }
        set({
          token,
          user,
          isAuthenticated: true,
        })
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
        }
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        })
      },

      // Admin actions
      adminLogin: (token: string, admin: Admin) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("adminToken", token)
          localStorage.setItem("admin", JSON.stringify(admin))
        }
        set({
          adminToken: token,
          admin,
          isAdminAuthenticated: true,
        })
      },

      adminLogout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("adminToken")
          localStorage.removeItem("admin")
        }
        set({
          adminToken: null,
          admin: null,
          isAdminAuthenticated: false,
        })
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        admin: state.admin,
        adminToken: state.adminToken,
        isAdminAuthenticated: state.isAdminAuthenticated,
      }),
    },
  ),
)

// Main auth hook
export const useAuth = () => {
  return useAuthStore()
}

// Helper hook for admin authentication
export const useAdminAuth = () => {
  const { admin, adminToken, isAdminAuthenticated, adminLogin, adminLogout } = useAuthStore()

  return {
    admin,
    token: adminToken,
    isAuthenticated: isAdminAuthenticated,
    login: adminLogin,
    logout: adminLogout,
  }
}

// Helper hook for user authentication
export const useUserAuth = () => {
  const { user, token, isAuthenticated, login, logout } = useAuthStore()

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
  }
}
