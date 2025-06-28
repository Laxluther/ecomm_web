import axios from "axios"

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// Create axios instances
export const api = axios.create({
  baseURL: `${API_BASE_URL}/user`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

export const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// Admin request interceptor
adminApi.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("adminToken")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Admin response interceptor
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("adminToken")
      localStorage.removeItem("admin")
      window.location.href = "/admin/login"
    }
    return Promise.reject(error)
  },
)

// API Functions

// Authentication
export const authAPI = {
  login: async (email: string, password: string, remember_me = false) => {
    const response = await api.post("/auth/login", { email, password, remember_me })
    return response.data
  },

  register: async (userData: {
    email: string
    password: string
    first_name: string
    last_name: string
    phone: string
    referral_code?: string
  }) => {
    const response = await api.post("/auth/register", userData)
    return response.data
  },

  verifyEmail: async (token: string) => {
    const response = await api.post("/auth/verify-email", { token })
    return response.data
  },

  resendVerification: async (email: string) => {
    const response = await api.post("/auth/resend-verification", { email })
    return response.data
  },

  forgotPassword: async (email: string) => {
    const response = await api.post("/auth/forgot-password", { email })
    return response.data
  },

  validateResetToken: async (token: string) => {
    const response = await api.post("/auth/validate-reset-token", { token })
    return response.data
  },

  resetPassword: async (token: string, password: string, confirm_password: string) => {
    const response = await api.post("/auth/reset-password", { token, password, confirm_password })
    return response.data
  },
}

// Admin Authentication
export const adminAPI = {
  login: async (username: string, password: string) => {
    const response = await adminApi.post("/auth/login", { username, password })
    return response
  },
}

// Products
export const productsAPI = {
  getFeatured: async () => {
    const response = await api.get("/products/featured")
    return response.data
  },

  getAll: async (params?: { category_id?: string; search?: string; page?: number; per_page?: number }) => {
    const queryString = params ? new URLSearchParams(params as any).toString() : ""
    const response = await api.get(`/products${queryString ? `?${queryString}` : ""}`)
    return response.data
  },

  getById: async (id: string) => {
    const response = await api.get(`/products/${id}`)
    return response.data
  },
}

// Categories
export const categoriesAPI = {
  getAll: async () => {
    const response = await api.get("/categories")
    return response.data
  },
}

// Cart
export const cartAPI = {
  get: async () => {
    const response = await api.get("/cart")
    return response.data
  },

  add: async (product_id: number, quantity: number) => {
    const response = await api.post("/cart/add", { product_id, quantity })
    return response.data
  },

  update: async (product_id: number, quantity: number) => {
    const response = await api.put("/cart/update", { product_id, quantity })
    return response.data
  },

  remove: async (product_id: number) => {
    const response = await api.delete(`/cart/remove/${product_id}`)
    return response.data
  },
}

// Addresses
export const addressesAPI = {
  getAll: async () => {
    const response = await api.get("/addresses")
    return response.data
  },

  add: async (addressData: any) => {
    const response = await api.post("/addresses", addressData)
    return response.data
  },

  update: async (id: number, addressData: any) => {
    const response = await api.put(`/addresses/${id}`, addressData)
    return response.data
  },

  delete: async (id: number) => {
    const response = await api.delete(`/addresses/${id}`)
    return response.data
  },
}

// Referrals
export const referralsAPI = {
  validate: async (code: string) => {
    const response = await api.post("/referrals/validate", { code })
    return response.data
  },

  get: async () => {
    const response = await api.get("/referrals")
    return response.data
  },
}

// Wallet
export const walletAPI = {
  get: async () => {
    const response = await api.get("/wallet")
    return response.data
  },
}

// Wishlist
export const wishlistAPI = {
  get: async () => {
    const response = await api.get("/wishlist")
    return response.data
  },

  add: async (product_id: number) => {
    const response = await api.post("/wishlist/add", { product_id })
    return response.data
  },

  remove: async (product_id: number) => {
    const response = await api.delete(`/wishlist/remove/${product_id}`)
    return response.data
  },
}

// Admin APIs
export const adminProductsAPI = {
  getAll: async (params?: { page?: number; per_page?: number }) => {
    const queryString = params ? new URLSearchParams(params as any).toString() : ""
    const response = await adminApi.get(`/products${queryString ? `?${queryString}` : ""}`)
    return response.data
  },

  add: async (productData: any) => {
    const response = await adminApi.post("/products", productData)
    return response.data
  },

  update: async (id: number, productData: any) => {
    const response = await adminApi.put(`/products/${id}`, productData)
    return response.data
  },

  delete: async (id: number) => {
    const response = await adminApi.delete(`/products/${id}`)
    return response.data
  },
}

export const adminDashboardAPI = {
  getStats: async () => {
    const response = await adminApi.get("/dashboard")
    return response.data
  },
}

export const adminCategoriesAPI = {
  getAll: async () => {
    const response = await adminApi.get("/categories")
    return response.data
  },
}

export const adminUsersAPI = {
  getAll: async (params?: { page?: number; per_page?: number }) => {
    const queryString = params ? new URLSearchParams(params as any).toString() : ""
    const response = await adminApi.get(`/users${queryString ? `?${queryString}` : ""}`)
    return response.data
  },
}

export const adminOrdersAPI = {
  getAll: async (params?: { page?: number; per_page?: number }) => {
    const queryString = params ? new URLSearchParams(params as any).toString() : ""
    const response = await adminApi.get(`/orders${queryString ? `?${queryString}` : ""}`)
    return response.data
  },
}

export const adminReferralsAPI = {
  getAll: async (params?: { page?: number; per_page?: number }) => {
    const queryString = params ? new URLSearchParams(params as any).toString() : ""
    const response = await adminApi.get(`/referrals${queryString ? `?${queryString}` : ""}`)
    return response.data
  },
}

export default api
