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

export const useAuth = create<AuthState>()(
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
        localStorage.setItem("token", token)
        localStorage.setItem("user", JSON.stringify(user))
        set({
          token,
          user,
          isAuthenticated: true,
        })
      },

      logout: () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        })
      },

      // Admin actions
      adminLogin: (token: string, admin: Admin) => {
        localStorage.setItem("adminToken", token)
        localStorage.setItem("admin", JSON.stringify(admin))
        set({
          adminToken: token,
          admin,
          isAdminAuthenticated: true,
        })
      },

      adminLogout: () => {
        localStorage.removeItem("adminToken")
        localStorage.removeItem("admin")
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
