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

// ===== USER APIs =====

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

// Products
export const productsAPI = {
  getFeatured: async () => {
    const response = await api.get("/products/featured")
    return response.data
  },

  getAll: async (params?: { 
    category_id?: string; 
    search?: string; 
    page?: number; 
    per_page?: number;
    sort_by?: string;
  }) => {
    const cleanParams: Record<string, string> = {}
    
    if (params?.category_id) cleanParams.category_id = params.category_id
    if (params?.search?.trim()) cleanParams.search = params.search.trim()
    if (params?.page && params.page > 1) cleanParams.page = params.page.toString()
    if (params?.per_page) cleanParams.per_page = params.per_page.toString()
    if (params?.sort_by) cleanParams.sort_by = params.sort_by
    
    const queryString = new URLSearchParams(cleanParams).toString()
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
    try {
      console.log("categoriesAPI.getAll: Making request to /public/categories")
      const response = await publicApi.get("/public/categories")  
      console.log("categoriesAPI.getAll: Response data:", response.data)
      
      // Backend returns: { categories: [...] }
      // Frontend expects: categoriesData.categories
      if (response.data && response.data.categories) {
        console.log("categoriesAPI.getAll: Found", response.data.categories.length, "categories")
        return response.data  // Return full object so frontend can access .categories
      } else {
        console.warn("categoriesAPI.getAll: No categories in response, returning empty")
        return { categories: [] }
      }
    } catch (error) {
      console.error("categoriesAPI.getAll: Error fetching categories:", error)
      throw error
    }
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
    const mappedData = {
      type: addressData.type || "home",
      name: addressData.name,
      phone: addressData.phone,
      address_line_1: addressData.address_line_1,
      address_line_2: addressData.address_line_2 || "",
      city: addressData.city,
      state: addressData.state,
      pincode: addressData.pincode,
      landmark: addressData.landmark || "",
      is_default: addressData.is_default || false,
    }
    
    const response = await api.post("/addresses", mappedData)
    return response.data
  },

  update: async (id: number, addressData: any) => {
    const mappedData = {
      type: addressData.type || "home",
      name: addressData.name,
      phone: addressData.phone,
      address_line_1: addressData.address_line_1,
      address_line_2: addressData.address_line_2 || "",
      city: addressData.city,
      state: addressData.state,
      pincode: addressData.pincode,
      landmark: addressData.landmark || "",
      is_default: addressData.is_default || false,
    }
    
    const response = await api.put(`/addresses/${id}`, mappedData)
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

// ===== ADMIN APIs =====

// Admin Authentication
export const adminAPI = {
  login: async (username: string, password: string) => {
    const response = await adminApi.post("/auth/login", { username, password })
    return response
  },
}

// Admin Products
export const adminProductsAPI = {
  getAll: async (params?: { page?: number; per_page?: number; search?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.per_page) queryParams.append("per_page", params.per_page.toString())
    if (params?.search) queryParams.append("search", params.search)

    const response = await adminApi.get(`/products${queryParams.toString() ? `?${queryParams.toString()}` : ""}`)
    return response.data
  },

  getById: async (id: number) => {
    const response = await adminApi.get(`/products/${id}`)
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

  uploadImage: async (id: number, formData: FormData) => {
    const response = await adminApi.post(`/products/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}

// Admin Categories
export const adminCategoriesAPI = {
  getAll: async () => {
    const response = await adminApi.get("/categories")
    return response.data
  },

  add: async (categoryData: any) => {
    const response = await adminApi.post("/categories", categoryData)
    return response.data
  },

  update: async (id: number, categoryData: any) => {
    const response = await adminApi.put(`/categories/${id}`, categoryData)
    return response.data
  },

  delete: async (id: number, force: boolean = false) => {
    // Add force parameter as query string
    const queryParam = force ? '?force=true' : ''
    const response = await adminApi.delete(`/categories/${id}${queryParam}`)
    return response.data
  },
}

// Admin Dashboard
export const adminDashboardAPI = {
  getStats: async () => {
    const response = await adminApi.get("/dashboard")
    return response.data
  },
}

// Admin Users
export const adminUsersAPI = {
  getAll: async (params?: { page?: number; per_page?: number; search?: string; status?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.per_page) queryParams.append("per_page", params.per_page.toString())
    if (params?.search) queryParams.append("search", params.search)
    if (params?.status) queryParams.append("status", params.status)

    const response = await adminApi.get(`/users${queryParams.toString() ? `?${queryParams.toString()}` : ""}`)
    return response.data
  },

  updateStatus: async (id: string, status: string) => {
    const response = await adminApi.put(`/users/${id}/status`, { status })
    return response.data
  },
}

// Admin Orders
export const adminOrdersAPI = {
  getAll: async (params?: { page?: number; per_page?: number; status?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.per_page) queryParams.append("per_page", params.per_page.toString())
    if (params?.status) queryParams.append("status", params.status)

    const response = await adminApi.get(`/orders${queryParams.toString() ? `?${queryParams.toString()}` : ""}`)
    return response.data
  },

  updateStatus: async (id: string, status: string) => {
    const response = await adminApi.put(`/orders/${id}/status`, { status })
    return response.data
  },
}

// Admin Referrals
export const adminReferralsAPI = {
  getAll: async (params?: { page?: number; per_page?: number }) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.per_page) queryParams.append("per_page", params.per_page.toString())

    const response = await adminApi.get(`/referrals${queryParams.toString() ? `?${queryParams.toString()}` : ""}`)
    return response.data
  },
}
// Orders API - ADD THIS SECTION
export const ordersAPI = {
  getAll: async () => {
    const response = await api.get("/orders")
    return response.data
  },

  create: async (orderData: {
    items: Array<{
      product_id: number
      product_name: string
      quantity: number
      price: number
    }>
    shipping_address: {
      name: string
      phone: string
      address_line_1: string
      address_line_2?: string
      city: string
      state: string
      pincode: string
      landmark?: string
      type: string
    }
    payment_method: string
    subtotal: number
    shipping_amount: number
    tax_amount: number
    total_amount: number
  }) => {
    const response = await api.post("/orders", orderData)
    return response.data
  },

  getById: async (id: string) => {
    const response = await api.get(`/orders/${id}`)
    return response.data
  },
}
// Default export
export default api