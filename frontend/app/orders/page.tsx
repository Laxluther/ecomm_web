"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, Package, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/Button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

interface Order {
  order_id: number
  order_number: string
  order_date: string
  total_amount: number
  payment_method: string
  status: string
  items_count: number
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/orders")
      return
    }

    loadOrders()
  }, [user, router])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await api.getOrders()
      if (response.data?.orders) {
        setOrders(response.data.orders)
      }
    } catch (error) {
      console.error("Failed to load orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "processing":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "shipped":
        return <Package className="h-5 w-5 text-orange-500" />
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "cancelled":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "shipped":
        return "bg-orange-100 text-orange-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="container py-16 min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-heading font-bold text-green-800 mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex justify-center mb-4">
            <Package className="h-16 w-16 text-gray-300" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-green-800 mb-4">No orders yet</h2>
          <p className="text-green-700 mb-8">
            You haven't placed any orders yet. Start shopping to see your orders here.
          </p>
          <Link href="/shop">
            <Button size="lg">Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-50 border-b border-green-100">
                <tr>
                  <th className="py-4 px-6 text-left text-sm font-medium text-green-800">Order</th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-green-800">Date</th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-green-800">Status</th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-green-800">Total</th>
                  <th className="py-4 px-6 text-right text-sm font-medium text-green-800">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-100">
                {orders.map((order) => (
                  <tr key={order.order_id} className="hover:bg-green-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-green-800">{order.order_number}</span>
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                          {order.items_count} {order.items_count === 1 ? "item" : "items"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-green-700">{new Date(order.order_date).toLocaleDateString()}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(
                            order.status,
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-green-800">₹{order.total_amount.toFixed(2)}</td>
                    <td className="py-4 px-6 text-right">
                      <Link href={`/orders/${order.order_id}`}>
                        <Button variant="outline" size="sm">
                          View Details <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
