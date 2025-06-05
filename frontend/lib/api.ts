const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

interface WalletData {
  balance: number
  transactions: Array<{
    id: string
    type: "credit" | "debit"
    amount: number
    description: string
    date: string
    status: "completed" | "pending" | "failed"
  }>
}

interface CheckoutSummary {
  subtotal: number
  discount_amount: number
  shipping_cost: number
  tax_amount: number
  total_amount: number
  promocode_applied: boolean
  promocode_description?: string
  promocode_discount_percentage?: number
  promocode_discount_amount?: number
  free_shipping: boolean
}

interface ProductsResponse {
  products: Array<{
    product_id: number
    product_name: string
    price: number
    discount_price: number
    primary_image: string
    average_rating: number
    total_reviews: number
    savings: number
    savings_percentage: number
    in_stock: boolean
    category_name: string
    brand?: string
    description: string
  }>
  pagination: {
    page: number
    pages: number
    per_page: number
    total: number
  }
}

interface CategoriesResponse {
  categories: Array<{
    category_id: number
    category_name: string
    product_count: number
  }>
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor() {
    this.baseURL = API_BASE_URL
    // Initialize token from localStorage if available
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("auth_token", token)
      } else {
        localStorage.removeItem("auth_token")
      }
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      }

      // Add Authorization header if token exists
      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      console.error("API request failed:", error)
      return { error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  // Add authentication methods
  async login(credentials: { email: string; password: string; remember_me?: boolean }): Promise<ApiResponse<any>> {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  }

  async register(userData: any): Promise<ApiResponse<any>> {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.request("/auth/me")
  }

  // Wallet API
  async getWallet(): Promise<ApiResponse<WalletData>> {
    return this.request<WalletData>("/wallet")
  }

  async addMoneyToWallet(amount: number): Promise<ApiResponse<{ success: boolean }>> {
    return this.request("/wallet/add", {
      method: "POST",
      body: JSON.stringify({ amount }),
    })
  }

  // Products API
  async getProducts(params: any = {}): Promise<ApiResponse<ProductsResponse>> {
    const searchParams = new URLSearchParams()
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        searchParams.append(key, params[key].toString())
      }
    })

    return this.request<ProductsResponse>(`/products?${searchParams.toString()}`)
  }

  async getProduct(id: string): Promise<ApiResponse<any>> {
    return this.request(`/products/${id}`)
  }

  // Categories API
  async getCategories(): Promise<ApiResponse<CategoriesResponse>> {
    return this.request<CategoriesResponse>("/categories")
  }

  // Checkout API
  async getCheckoutSummary(params: { state_code?: string; promocode?: string }): Promise<ApiResponse<CheckoutSummary>> {
    const searchParams = new URLSearchParams()
    if (params.state_code) searchParams.append("state_code", params.state_code)
    if (params.promocode) searchParams.append("promocode", params.promocode)

    return this.request<CheckoutSummary>(`/checkout/summary?${searchParams.toString()}`)
  }

  // Orders API
  async getOrders(): Promise<ApiResponse<any>> {
    return this.request("/orders")
  }

  async getOrder(id: string): Promise<ApiResponse<any>> {
    return this.request(`/orders/${id}`)
  }

  async createOrder(orderData: any): Promise<ApiResponse<any>> {
    return this.request("/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    })
  }

  // Featured Products API - Placeholder for your future implementation
  async getFeaturedProducts(): Promise<ApiResponse<any>> {
    // This will call your future featured products endpoint
    // For now it will fail gracefully and show placeholder
    return this.request("/products/featured")
  }

  // Remove the old getFeaturedCategories since we're using all categories
}

export const api = new ApiClient()
