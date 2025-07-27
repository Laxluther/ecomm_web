// Complete replacement for frontend/app/orders/page.tsx

"use client"

import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Package, Truck, CheckCircle, Clock, Eye, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { ordersAPI } from "@/lib/api"
import Link from "next/link"
import Image from "next/image"
import toast from "react-hot-toast"

interface Order {
  order_id: string
  order_number?: string
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
  total_amount?: number
  created_at: string
  item_count?: number
}

export default function OrdersPage() {
  const { isAuthenticated } = useAuth()

  // Fetch real orders from API
  const { data: ordersData, isLoading, error, refetch } = useQuery({
    queryKey: ["user-orders"],
    queryFn: async () => {
      const response = await ordersAPI.getAll()
      return response
    },
    enabled: isAuthenticated,
    retry: 2,
    staleTime: 30000, // Cache for 30 seconds
  })

  const orders = ordersData?.orders || []

  // DEBUG: Temporarily log the API response
  useEffect(() => {
    if (ordersData) {
      console.log('=== ORDERS DEBUG ===')
      console.log('Full API Response:', ordersData)
      console.log('Orders Array:', ordersData.orders)
      
      if (ordersData.orders && ordersData.orders.length > 0) {
        const firstOrder = ordersData.orders[0]
        console.log('First Order:', firstOrder)
        console.log('total_amount type:', typeof firstOrder.total_amount)
        console.log('total_amount value:', firstOrder.total_amount)
        console.log('formatCurrency test:', formatCurrency(firstOrder.total_amount))
      }
      console.log('===================')
    }
  }, [ordersData])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />
      case "processing":
        return <Package className="h-4 w-4" />
      case "shipped":
        return <Truck className="h-4 w-4" />
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
      case "refunded":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "processing":
        return "bg-purple-100 text-purple-800"
      case "shipped":
        return "bg-indigo-100 text-indigo-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "refunded":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Helper function to safely format currency
  const formatCurrency = (value: any) => {
    const num = parseFloat(value) || 0
    return `₹${num.toFixed(2)}`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date not available'
    
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Invalid date'
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
            <p className="text-gray-600 mb-8">You need to login to view your orders</p>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          {error && (
            <Button onClick={() => refetch()} variant="outline">
              Retry
            </Button>
          )}
        </div>

        {isLoading ? (
          // Loading state
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded w-32"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          // Error state
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Orders</h2>
                <p className="text-gray-600 mb-4">There was an error loading your orders</p>
                <Button onClick={() => refetch()}>Try Again</Button>
              </div>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          // Empty state
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h2>
                <p className="text-gray-600 mb-8">You haven't placed any orders yet. Start shopping to see your orders here!</p>
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                  <Link href="/shop">Start Shopping</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Orders list
          <div className="space-y-4">
            {orders.map((order: Order) => (
              <Card key={order.order_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">Order #{order.order_number || order.order_id}</h3>
                      <p className="text-sm text-gray-600">
                        Placed on {formatDate(order.created_at)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status}</span>
                      </div>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-semibold">{formatCurrency(order.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Items</p>
                      <p className="font-semibold">{order.item_count || 0} item(s)</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Order ID</p>
                      <p className="font-mono text-sm">{order.order_id}</p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <span className="text-sm text-gray-600">
                        Status: <span className="capitalize font-medium">{order.status}</span>
                      </span>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/orders/${order.order_id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}